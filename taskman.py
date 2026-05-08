from tm_mod import *
from time import sleep
import json

SAVED_TASKS:         str = 'tm_tasks.json'
SAVED_METADATA:      str = 'metadata.txt'
PRI_DOM: tuple[int, int] = (0,   2)  #Priority domain
DUR_DOM: tuple[int, int] = (0, 300)  #Duration domain
WORDS:         list[str] = ['Low', 'Mid', 'High'] #!!! Maybe should be deleted in the future. To use it only in the module.


tasks:     dict[str, tuple[int, int]] = {}
pri_tasks: dict[str, tuple[int, int]] = {}
tasks_names:                list[str] = []

tasks_metadata:  str = ''
completed_tasks: int = 0

#!!! Make them functions in the future
try:
    with open(SAVED_TASKS, 'r') as file:
        tm_tasks: dict[str, list[int, int]] = json.load(file)

        for index, value in tm_tasks.items():
            tasks[index] = tuple(value)

except (FileNotFoundError, json.JSONDecodeError):
    with open(SAVED_TASKS, 'w') as file:
        json.dump({}, file)

try:
    with open(SAVED_METADATA, 'r') as file:
        tasks_metadata = file.read().strip()

except (FileNotFoundError):
    with open(SAVED_METADATA, 'w') as file:
        file.write('Completed Tasks - 0 - Highlighted Tasks - 0')


#------------------------------------------------------------#
#---            Main Menu: Welcome to TaskMan!            ---#
#------------------------------------------------------------#

while True:
    clear()
    printb('Welcome to TaskMan!')
    print('Available actions:')
    print('  i: Introduce new tasks.\n'
        + '  e: Edit existing tasks.\n'
        + '  d: Display all of the tasks.\n'
        + '  s: Send tasks to my email.\n'
        + '  q: Quit the program.')
    GINP: str = input('>>> ').strip().lower() #Global Input

    if GINP == 'q':
        break

    #-------------------------------------------------------------#
    #---             Getting and sorting new tasks             ---#
    #-------------------------------------------------------------#

    elif GINP == 'i':

        #--=   Initial Loop: Getting the user's tasks   =--#
        while True:
            clear()
            tasks_names: list[str] = get_data('Please introduce all of your tasks separated by ", ".')

            while True:
                clear()
                printb('You have introduced these tasks.')
                print_list(tasks_names)
                print('Did you forget to add any?')
                print('  y: Add more tasks to the existing list.\n  n: Continue.\n  r: Rewrite the whole list.')
                INP: str = input('>>> ').strip().lower()
                
                if INP == 'y':
                    clear()
                    tasks_names += get_data('Please introduce the new tasks separated by ", ".')
                    continue
                
                elif INP == 'n' or INP == 'r':
                    break #Both n and r take place in the larger loop

                else:
                    printb('ERROR: Input has to be either y/n/r.')
                    sleep(1)
                    continue

            if INP == 'n': break


        #--=   Second Loop: Getting the values for each task   =--#
        for name in tasks_names:
            while True:
                clear()
                printb(name.title())
                #Priority, Duration
                PRI_DUR: list[str] = get_data('Please introduce its priority and duration (in minutes) separated by ", ".', minlen=2)
                PRI_CHECK: tuple[bool, int | str] = check(PRI_DUR[0], domain=PRI_DOM)
                DUR_CHECK: tuple[bool, int | str] = check(PRI_DUR[1], domain=DUR_DOM)

                if PRI_CHECK[0] and DUR_CHECK[0]:
                    tasks[name] = (PRI_CHECK[1], DUR_CHECK[1])
                    break

                if not PRI_CHECK[0]: printb('ERROR: ' + PRI_CHECK[1])
                if not DUR_CHECK[0]: printb('ERROR: ' + DUR_CHECK[1])
                
                sleep(2)

        tasks = order(tasks)
        save(tasks, SAVED_TASKS, 'json')


    #------------------------------------------------------------#
    #---        Editing tasks: Remove, Move, Highlight        ---#
    #------------------------------------------------------------#

    elif GINP == 'e':
        if not tasks:
            print('You have no tasks to edit!')
            sleep(1)
            continue
        
        editing: bool = True

        while editing:
            clear()
            printb('These are all of your tasks.')
            print_list(tasks.keys())
            print('Press:')
            print('  d: To enter delete mode.\n  b: Go back to the main menu.')
            INP: str = input('>>> ').strip().lower()

            #--=   Getting the indices   =--#
            if INP == 'd':
                d_indices: list[str] = get_data('Please introduce the indices (starting from 1) separated by ", ".')
                d_indices = sorted(list(set(d_indices))) #Removing duplicates

                #Checking if each index is valid
                for idx in d_indices:
                    IDX_CHECK: tuple[bool, int | str] = check(idx, domain=(1, len(tasks.keys())))
                    if not IDX_CHECK[0]:
                        editing = True
                        printb('ERROR: ' + IDX_CHECK[1])
                        print('Nothing was deleted.')
                        sleep(1)
                        break
                    editing = False


                #--=   Updating the tasks since indices were valid   =--#
                if not editing:
                    tasks = idx_delete(tasks, indices=d_indices)
                    save(tasks, SAVED_TASKS, 'json')
                    sleep(1) #So the user can see idx_delete's printed lines
            
            elif INP == 'b':
                editing = False
                break

            else:
                printb('ERROR: Input has to be either r/m/h/b.')
                sleep(1)
                continue


    #------------------------------------------------------------#
    #---                  Printing the tasks                  ---#
    #------------------------------------------------------------#

    elif GINP == 'd':
        clear()
        display(tasks)
        input('Press enter to continue.')


    #-------------------------------------------------------------#
    #---   Formatting the tasks and sending them to my email   ---#
    #-------------------------------------------------------------#

    elif GINP == 's':
        clear()

        if not tasks:
            printb('ERROR: Cannot send an empty email.')
            sleep(1)

        else:
            email_body: str = ''
            chunk: str      = '' #Temporary storage

            for pri in range(2, -1, -1): #Priority's domain
                email_body += f'{WORDS[pri].upper()} PRIORITY TAKS.' + '\n'

                pri_tasks = {}
                for key in tasks.keys():
                    if tasks[key][0] == pri:
                        pri_tasks[key] = tasks[key]
                        chunk += f'{key}: {total_time([tasks[key][1]])}' + '\n'

                email_body += f'Expected duration: {total_time(value[1] for value in pri_tasks.values())}'  + '\n'
                email_body += chunk + '\n'
                chunk       = ''

            send_email(email_body, len(tasks))

    else:
        printb('ERROR: Unsoported action, input has to be either i/r/d/s/q.')
        sleep(1)

clear()
display(tasks)
print('See you soon!')
import os
import json
import smtplib
import personal_data as my
from time import sleep
from email.message import EmailMessage

VERSION: str = '1.3.2'


def clear(v: str = VERSION) -> None:
    """Clears the console and prints TaskMan along its version"""
    os.system('cls' if os.name == 'nt' else 'clear')
    print(f'TaskMan v{v}'+'\n')


def printb(message: str) -> None:
    """Prints the given message in bold."""
    print('\033[1m' + message + '\033[0m')


def save(data: dict[str, tuple[int, int]]) -> None:
    """Saves the given data in the JSON file, currently, the only one."""
    with open('tm_tasks.json', 'w') as file:
        json.dump(data, file, indent=4)


def print_list(data: list) -> None:
    """Prints the given list in a more readable way."""
    for index, item in enumerate(data, 1):
        print('    ', end='')
        if index < 10: print(' ', end='') #Aligning indexes
        print(f'{index}. {item.title()}')
    print() #Empty line


def total_time(data: list[int]) -> str:
    """Returns a string displaying the time in hours and minutes."""
    total: int = sum(data)
    hours: int = total//60
    mins:  int = total - hours*60

    return f'{hours}h {mins}"'


def idx_delete(data: dict[str, tuple[int, int]], indices:list[str]) -> dict[str, tuple[int, int]]:
    """Returns the given data after removing the unwanted key-value pairs"""
    DATA_KEYS:list[str] = list(data.keys())
        
    for idx in indices:
        print(f'{DATA_KEYS[int(idx)-1].title()} successfully deleted.')
        del data[DATA_KEYS[int(idx)-1]]

    return data


def get_data(message: str, minlen: int = 1) -> list[str]:
    """Returns the input splitted. A minimum set of elements can be specified, one will be fine otherwise."""
    while True:
        print(message) #Instructions for the user
        inp: str = input('>>> ')

        if ',' in inp:
            return [task.strip() for task in inp.split(',')]

        elif minlen <= 1:
            return [inp.strip()]
        
        else:
            print('The separator ", " was not found in the given string.\n')


def check(data: str, domain: tuple = (0, 5)) -> tuple[bool, int | str]:
    """Checks if data is an integer and if it is inside the given range/domain."""
    try:
        num = int(data)
        
        if domain[0] <= num <= domain[1]:
            return (True, num)
        
        else:
            return (False, f'The number {num} does not belong to the given domain: {domain}.')
            
    except (ValueError, TypeError):
        return (False, f'"{data}" cannot be converted to an integer.')


def send_email(body: str, quant: int) -> None:
    """Sends the data to my mail."""
    
    MY_EMAIL:     str = my.EMAIL
    APP_PASSWORD: str = my.PASSWORD
    
    msg = EmailMessage()
    msg['Subject'] = f'Tasks: You have {quant} remaining.'
    msg['From']    = MY_EMAIL
    msg['To']      = MY_EMAIL
    msg.set_content(body) #The actual body of the email

    print('Sending email...')
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(MY_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        print('Email sent successfully!')
        sleep(1)
        
    except Exception as e:
        printb(f"ERROR: {e}")


def order(data: dict[str, tuple[int, int]], pri_domain: tuple[int, int]=(0, 2)) -> dict[str, tuple[int, int]]:
    """----------------------------------------------------------------------------------""
    Tasks are ordered in function of Prioriy and Duration.
    This function returns the data (dict) sorted following this criteria:

    1.  Priority: from highest  to least.          2  --> 0
    2.  Duration: from quickest to longest tasks.  0' --> 300'

    In this way, quick high-priority tasks will be positioned before long high-priority
    ones and much before than any lower-priority others.

    ""-----------------------------------------------------------------------------------"""

    result:   dict[str, tuple[int, int]]        = {}
    cur_data: dict[str, tuple[int, int]]        = {} #Temporary dict for storing between operations
    chunk:    list[tuple[str, tuple[int, int]]] = [] #Temporary list for | | |

    for pri in range(pri_domain[1], pri_domain[0]-1, -1):
        cur_data = data.copy()
        
        for index, value in data.items():
            if value[0] != pri: cur_data.pop(index) #Deleting unwanted tasks
        
        chunk = sorted(cur_data.items(), key=lambda dur: dur[1][1]) #Sorting in increasing duration
        
        result |= dict(chunk)
    
    return result


#--=   Debug zone   =--#
if __name__ == '__main__':
    send_email('Hello')
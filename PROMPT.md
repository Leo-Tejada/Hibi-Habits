# Hibi Habits
*Read the repo (it should have everything needed to get started)*.

**Build modular and reusable code, this project will be big.**

You are building a habit tracker web-app.

It will have 5 screens:
* Homepage
* Daily tasks
* Journal and mood tracker
* Quests tracker
* Habit and training tracker

The philosophy of the web-app is the following. Everything in life falls into one of these categories:
- **Health**
	- Mind
	- Body
	- Spirit
- **Relationships**
	- Love
	- Family
	- Friends
- **Independence**
	- Work
	- Growth
	- Money

Each three months, a new **season** starts. The cycle is the following:
1. Start of the season
2. Setting **main quests** for the upcoming 3 months
3. Setting *side quests* (optional) for the same 3 months
4. Add tasks linked to either **main** or *side* quests
5. Keep living while updating my status constantly
6. End of the season, the user completes a ceremonial form of self-reflection

The web-app is heavy on statistics and tracking as a whole. That is why there is a subjacent hierarchy in each of the logged actions:
3 Categories *Health* -> 3 Subcategories *Body* -> **Main**/*Side* Quests *Learn Handstand* -> Habit *Calisthenics (Push day)* -> Task *Do ```Calisthenics.Push``` today*

I will re-write it in another way so it is understood better. The user can change almost any of the parameters in that last example. For instance, they can modify one of their **habits** anytime they want. Or set new **main quests** at the start of each **season**. But, most probably they will be only interacting with the **tasks**. In other words, it is a pyramidal structure:
From the hierarchical POV:
- Category
- Subcategory
- Quest
- Habit
- Task

From the user's POV:
- Task
- Habit
- Quest
- Subcategory
- Category

They only touch their **quests** each three months. Furthermore, subcategories and categories aren't even modifiable because they are the foundation of Hibi Habits' philosophy.

**With that said, explanation time should be over. If you have any questions, ask me now.**

# Let's build
## Homepage
Let's start with the homepage. It should be **quest** oriented. So it should show the date, **main quests**, *side* quests, statistics (leave that as a blank square for now), and other minor numbers like: `days left until the new season` or alerts from other screens of the web-app like `alert from daily tasks, you forgot to do X yesterday!`.

Build with a philosophy close to 42's. I want to be able to edit the code myself and it will be nice if the functions were short and clear. I'll prefer 1000 lines of 20 line functions rather than 600 lines of 300 line functions.

If you got any questions. Ask me.

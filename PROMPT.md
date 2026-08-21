# Hibi Habits
*Read the repo (we are currently working on the Daily tasks page and the Background)*.

**Build modular and reusable code inspired by the philosophy of 42, this project will be big.**
I rather have 100 lines of 5 functions than 50 lines of a single function.

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
## Background
The other model left it unfinished. Bugs may be present. The only problem that I could really complain about right now is the zoom. The object looks too far away from the screen - even though I intentionally built it to be super up close.

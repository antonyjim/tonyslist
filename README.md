# tonyslist

Words from a fresh web dev: 

This project will be my first attempt at making a website that is linked to an sql database. I have never actually worked out of a database before this, but I am finding that it is not nearly as intimidating as I first thought. This project is purely for educational purposes and is not intended to ever reach production. However, I hope to complete it to a point that would be considered production ready. The goals of this project are:

- Create a dynamic web site generated from a mysql database
- Make an authentication method from scratch
- Maintain a minimal package.json
- Avoid jquery, maybe learn react some time in the future when the backend is built up

This will also be my first time working with git, so I apologize if my commit messages don't sound completed or competant. 


## Update 8/12/18

So far I have learned many things from this project. It has taught me most of what I know about javascript. However, being my first project I am starting to realize some key design flaws that are becoming more and more apparent as I continue development. I could spend hours debugging to get everything working again, but I would rather move on and take the knowledge I have gained from this project. Some things that I realized I should have been doing different from the start: 

- Maintain a seperation of code (especially with router files and sql)
- Take the time to set up proper stored procedures
- Maintain a clear file structure that resembles the example in express best practices
- Study more secure methods for performing certain tasks

That being said, I had to make these mistakes before I could grow. If you decide to run this site for any reason, I highly recommend using linux. There are certain errors in Windows that I have traced down and fixed along with certain things (like imagemagick) that only works in linux.

## Update 8/27/18

#### TS Branch Creation

The typescript branch is being created today to help me along with typescript before diving into my first big project, nodemyadmin. There will be occassional updates as I can only code when I have the time. For those looking to see a somewhat functional app, please turn to the master branch. There will be broken code published to this branch, and that's alright. 

The goal with this branch is to meet some of the goals in my last update as well as:

 - Have a strongly typed methodology going forward
 - Compile my client side JS with Babel
 - Maybe incorporate some sort of SPA
<<<<<<< HEAD
 - Work out the many bugs that are present in the pure JS branch


 ## Update 9/4/18

 ### tonyslist 2.0 in full swing

 What started out as a slight transition to typescript has turned into a full blown rewrite of tonylist as we know it. With the most recent changes, it has moved more to fit in with the MVC view, as is evident from the file structure changes. Typescript comes with its own hurdles, but on a whole, the site is moving to a much easier to understand code flow. Another added bonus of typescript that was not considered before, is the ease of tracing down bugs. Even in a project as small as tonyslist.
=======
 - Work out the many bugs that are present in the pure JS branch
>>>>>>> dc2c40ff57a414408f6d6a77708ac956293300ec

-- Drop any databases named tonyslist

    DROP DATABASE IF EXISTS `tonyslist`;

-- Create tonyslist

    CREATE DATABASE IF NOT EXISTS `tonyslist` DEFAULT CHARACTER SET utf8;
    USE `tonyslist`;

-- User table

    CREATE TABLE IF NOT EXISTS `users` (
        `pid` CHAR(8) NOT NULL PRIMARY KEY,
        `username` VARCHAR(20) NOT NULL,
        `oldUsername` VARCHAR(20),
        `pass` VARCHAR(60) NOT NULL,
        `email` VARCHAR(320) NOT NULL,
        `newEmail` VARCHAR(320),
        `givenName` VARCHAR(30),
        `famName` VARCHAR(40),
        `userlevel` TINYINT(1) NOT NULL,
        `lastlogin` DATETIME,
        `ptoken` VARCHAR(36),
        `emailReset` VARCHAR(36),
        `deletion` VARCHAR(36),
        `active` BOOLEAN,
        `setup` BOOLEAN
    );

-- userData table

    CREATE TABLE IF NOT EXISTS `userData` (
        `usnum` INT NOT NULL PRIMARY KEY,
        `pid` CHAR(8) NOT NULL,
        `phone` INT(11),
        `zip` INT(9),

        INDEX (`pid`),

        FOREIGN KEY (`pid`) 
            REFERENCES `users`(`pid`)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

-- post table

    CREATE TABLE IF NOT EXISTS `post` (
        `postPid` VARCHAR(8) NOT NULL PRIMARY KEY,
        `pid` CHAR(8) NOT NULL,
        `title` VARCHAR(100),
        `zip` INT(9),
        `post` VARCHAR(10),
        `desc` VARCHAR(1000),
        `contact` INT(11),
        `price` INT(7),
        `createdOn` DATETIME,
        `lastViewed` DATETIME,
        `viewCount` INT(7),
        `active` BOOLEAN NOT NULL,

        INDEX (`pid`),

        FOREIGN KEY (`pid`) 
            REFERENCES `users`(`pid`)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

-- news table

    CREATE TABLE IF NOT EXISTS `news` (
        `pid` CHAR(36) NOT NULL PRIMARY KEY,
        `owner` CHAR(8) NOT NULL,
        `title` VARCHAR(100),
        `body` VARCHAR(2000),
        `createdOn` DATETIME,
        `lastViewed` DATETIME,
        `active` BOOLEAN,

        INDEX (`ownder`),

        FOREIGN KEY (`pid`) 
            REFERENCES `users`(`pid`)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );
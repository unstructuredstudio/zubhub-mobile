
# Intro

ZubHub is a free web platform that expands access to low-cost creative learning and collaboration opportunities globally to children in underserved communities.

It is available for custom use for your school, library, hackerspace, or educational organization. It can be hosted in low or no internet bandwidth locations to create a small virtual hub. These hubs can be interconnected to form an extensive distributed creative education network. You can think of it as [Mastodon](<https://en.wikipedia.org/wiki/Mastodon_(software)>) social network but specifically intended for showcasing and collaborating on creative educational projects. Or maybe like [Hackaday.io](https://hackaday.io/), but for children :smiley:



## Steps

1. Install [Git](https://git-scm.com/downloads). ( [jump to section](#install-git) )
2. [Fork](https://github.com/unstructuredstudio/zubhub-mobile/fork) and clone zubhub repository. ( [jump to section](#fork-and-clone-zubhub-repository) )
3. Install [Node.js 14 and npm 7 or later](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/). ( [jump to section](#install-node-and-npm) )
4. Setup Frontend. ( [jump to section](#setup-frontend) )

<br/>
<br/>

## Install Git

> **_NOTE:_** You can skip this step if you already have **git** installed on your machine. To check if **git** is running on your machine, run the following command `git --version`.

- click on this [link](https://git-scm.com/downloads), select your operating system from the options given, then download and install **git** on your local machine.

<br/>
<br/>

## Fork and clone Zubhub-mobile repository

- [fork](https://github.com/unstructuredstudio/zubhub-mobile/fork) the **zubhub-mobile** repository to your Github account.

- On the homepage of the cloned repository in your own Github account, click on the **code** button, copy the URL in the dropdown then run the following code in your computer terminal:

```sh
      $ git clone <copied url>
```

The copied URL will have the format of `https://github.com/<your github username>/zubhub-mobile.git`

<br/>
<br/>

## Install Node and NPM

> **_NOTE:_** You can skip this step if you already have **node** and **npm** installed on your machine. To check if **node** and **npm** are already installed on your machine, run the following command `node --version` and `npm --version`.

- Click on this [link](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/) and follow the given instructions to install **node** and **npm** on your local machine.

<br/>
<br/>

## Setup Frontend

## SETUP ON ANDROID DEVICE
- Install the expo-cli on your machine with the following command (`npm install -g expo-cli`)
- Open the terminal on the root of the cloned project and run npm install to install the dependencies
-  Make sure your computer and android device are connected on thesame network.
- Download the `Expo Go` app on google playstore
- Open the app and click scan QR 
- Run `expo start` to start the mobile app. 
- Scan the QR code on your terminal using the QR Code scanner opened on your mobile device.

<br/>
<br/>

## SETUP ON IOS DEVICE
- Install the expo-cli on your machine with the following command (`npm install -g expo-cli`)
- Open the terminal on the root of the cloned project and run npm install to install the dependencies
-  Make sure your computer and android device are connected on thesame network.
- Download the `Expo Go` app on Apples App Store
- Run `expo start` to start the mobile app.
- Open your device camera
- Scan the QR code on your terminal using your phones camera.


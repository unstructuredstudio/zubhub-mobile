
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

## Install Make

> **_NOTE:_** You can skip this step if you already have **make** installed on your machine. To check if **make** is running on your machine, run the following command `make --version`.

- If you are on a Linux machine, you can install **make** through this [link](https://www.gnu.org/software/make/).
- If you are on a Mac machine, you can google the specific steps of installing **make** on a mac machine.
- If you are on a Windows machine, you should refer to the **Windows Specific Setup** section at the beginning of the **Developer Setup** section.

<br/>
<br/>

## Setup Frontend

##SETUP ON ANDOID EMULATOR
- Install the expo-cli on your machine with the following command (`npm install -g expo-cli`)
- Open the terminal on the root of the cloned project and run npm install to install the dependencies
- Run `react-native run-android` to start the mobile app on your emulator. or yarn ios(If using yarn package manager)

<br/>
<br/>
##SETUP ON IOS SIMULATOR
- Install the expo-cli on your machine with the following command (`npm install -g expo-cli`)
- Open the terminal on the root of the cloned project and run npm install to install the dependencies
- Run `react-native run-ios` to start the mobile app on your emulator. or yarn ios(If using yarn package manager)

<br/>
<br/>
##SETUP ON ANDROID DEVICE
- Download the `Expo Go` app on google playstore
- Open the app and click scan QR 
- Install the expo-cli on your machine with the following command (`npm install -g expo-cli`)
- Open the terminal on the root of the cloned project and run npm install to install the dependencies
- Run `react-native run-ios` to start the mobile app on your emulator. or yarn ios(If using yarn package manager)

<br/>
<br/>

# Deployment

ZubHub is currently deployed on its main website using Github Actions that act as our build and deployment tooling. If you are interested in deploying Zubhub on your VM for testing and hosting purposes, follow the [Single VM Deployment](./single_vm_deployment/DEPLOYMENT.md) instructions.

<br/>
<br/>

# API Documentation

- [Architecture Overview](./zubhub_backend/zubhub/docs/docs/overview.md)
- [Web Server](./zubhub_backend/zubhub/docs/docs/web_container.md)
- [Media Server](./zubhub_backend/zubhub/docs/docs/media_container.md)
- [Database and ER Diagram](./zubhub_backend/zubhub/docs/docs/others.md)
- [Background Tasks](./zubhub_backend/zubhub/docs/docs/others.md)
- [Reverse-Proxy](./zubhub_backend/zubhub/docs/docs/others.md)

<br/>
<br/>

# Contributions

Contributions are welcome! We suggest you first go through the [Contribution Guidelines and Code of Conduct](CONTRIBUTING.md) and the [Feature Roadmap and Ideas](https://github.com/unstructuredstudio/zubhub/wiki/Feature-Roadmap-&-Ideas-2022) we have been working on. Search the Issues to see there are no duplicates or overlaps before filing new feature requests and bugs.

> **_NOTE:_** If you are interested in the API documentation instead, you need to follow the [instructions](#setup-backend) above about running the backend on your local machine and afterward visit **localhost:8000** on your browser to view the API documentation.

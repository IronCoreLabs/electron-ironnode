# IronNode in Electron

Proof of concept that shows how to use [IronNode](https://github.com/IronCoreLabs/ironnode) within an Electron app. The repo contains an example Electron project using IronNode and this README explains the problem and a step-by-step solution for how to make the Electron and IronNode play together.

## Quickstart

This repo is a bare-bones Electron app that when opened, initializes the IronNode SDK, create a group, display the details of the group, and then immediately delete the group. In order to test this out first make sure you have the Rust toolchain installed on your machine. Then do the following:

+ Run `npm install`
+ Replace the IronCore user device context variables within the `preload.js` file with your account/segment/keys that are returned from a `IronNode.User.generateDeviceKeys()` call.
+ Run `npm start`

If successful, on startup of the Electron app it will display a windows which will show the details of a group created via the IronNode SDK.

Read below for a in-depth guide for how this repo is setup and the steps required to make IronNode work in Electron.

## The Problem

IronNode relies on the [`recrypt-node-binding`](https://github.com/IronCoreLabs/recrypt-node-binding) library which is a native Node module written in Rust. This library is pre-compiled for various OS/Node version combinations to make it work for most Node projects. When a normal Node project adds IronNode as a dependency, a pre-compiled binary of the `recrypt-node-binding` dependency is pulled into the project for the OS/Node version the developer is on. Usually this step is invisible to the developer as it happens automatically during an `npm install`. In fact, [the source](https://unpkg.com/browse/@ironcorelabs/recrypt-node-binding@0.7.1/) for the `recrypt-node-binding` is little more than just configuration of where to pull the pre-compiled from and how to include it.

Unfortunately Electron uses a custom version of V8 [as described here](https://www.electronjs.org/docs/tutorial/using-native-node-modules) and therefore the binaries we prebuild for the `recrypt-node-binding` won't work for various versions of Electron. The common recommendation for how to make this work is to re-compile the native module library from source for the version of Electron being used. This is possible with the `recrypt-node-binding` library, but takes a little bit of work to get it functional.

## Adding IronNode as a Dependency

There's two issues with being able to recompile the `recrypt-node-binding` dependency from source for an Electron project. First, the raw Rust source isn't published to NPM. As mentioned above, the `recrypt-node-binding` source that is published to NPM is little more than configuration. Second, IronNode expects the resulting binary to be placed into a specific location on the file system when it is `require`d into Node source code. Both of these problems can be fixed with a few changes to dependency locations and NPM scripts.

### Prerequisites

Because we'll be compiling the `recrypt-node-binding` Rust library from source, you'll need the [Rust toolchain installed](https://www.rust-lang.org/tools/install). This will give you the tools needed to create a `recrypt-node-binding` binary that will work for the version of Electron used in your project.

### Adding Dependencies

The first step is to add `@ironcorelabs/ironnode` direct dependency into your project. When added, this will also automatically pull down the `recrypt-node-binding` dependency binary and place it in your `node_modules` directory. Now we need to overwrite this dependency to use the raw source library instead so we can compile it for Electron. Add the following two lines to the `package.json` `dependencies` section

```
"@ironcorelabs/ironnode": "^0.8.0",
"@ironcorelabs/recrypt-node-binding": "github:ironcorelabs/recrypt-node-binding#0.7.1"
```

In order to recompile the `recrypt-node-binding` dependency, we'll point directly to its GitHub repo. We'll also point to a tag of that repo in order to prevent unintended changes from getting introduced.

Now we need to add a couple build dependencies in order to build Rust. Add the following to your `devDependencies` section

```
"electron-build-env": "^0.2.0",
"neon-cli": "^0.3.3"
```

These two dependencies will allow us to build `recrypt-node-binding` from source.

### Install Scripts

Now that our dependencies are all setup, we need to add some NPM scripts that will perform the compilation when we run an `npm install`. These scripts have two goals: compile the Rust library from source, and move the resulting binary to the proper place within the `node_modules` directory.

Add the following lines under your `package.json` `scripts` section

```
"postinstall": "electron-build-env neon build @ironcorelabs/recrypt-node-binding --release && npm run moveBinary",
"moveBinary": "pushd ./node_modules/@ironcorelabs/recrypt-node-binding && mkdir -p ./bin-package && cp ./native/index.node ./bin-package/index.node && popd"
```

The first script, `postinstall` will run everytime the `npm install` command is run and finished. It rebuilds the `recrypt-node-binding` dependency for the version of Electron being used in the project. The `moveBinary` script then takes the resulting binary that was compiled and moves it to the proper place. The first time that `npm install` is run after adding these dependencies, the Rust comilation will run, which might take a little while. But once that is done, subsequent `npm install` runs should just check that the binary was already generated and do nothing.

### Including IronNode

Once `npm install` has completed successfully, IronNode can be included like any other Node dependency. Per Electron recommendations, this involes putting it in the `preload.js` file. Check the source to see this in action.

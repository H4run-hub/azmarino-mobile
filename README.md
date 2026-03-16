This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# One codebase: Android and iOS

AzmarinoMobile is a **single React Native project**. The same screens, navigation, language (Tigrinya / English), theme, and features run on **Android** and **iOS**. There is no separate iOS app to maintain — when you build for iOS on a Mac, you get the same look and functionality as the Android app.

## Building and deploying iOS (on Mac)

1. **Prerequisites**: Xcode, CocoaPods, Node.js. Open Terminal in the project root.

2. **Install JS dependencies** (if not already done):
   ```sh
   npm install
   ```

3. **Install iOS native dependencies**:
   ```sh
   cd ios && pod install && cd ..
   ```

4. **Run in the iOS Simulator**:
   ```sh
   npm run ios
   ```
   Or open `ios/AzmarinoMobile.xcworkspace` in Xcode, choose a simulator, and press Run.

5. **Deploy to a device or App Store**:
   - Open `ios/AzmarinoMobile.xcworkspace` in Xcode (use the `.xcworkspace`, not the `.xcodeproj`).
   - Select your development team and signing in the project settings.
   - For release: Product → Archive, then distribute to App Store Connect.

**App name**: The app appears as **Azmarino** on the home screen on both Android and iOS. Icons use `src/assets/AzmarinoLOGO.png`; regenerate with `npm run generate-android-icons` and `npm run generate-ios-icons` if you change the logo.

---

# Azmarino — Backend, payments & assets

This app is wired to a **real backend** for a production-ready flow:

- **Login / Register** — `POST /api/auth/login` and `/api/auth/register`; JWT stored on device; user data in MongoDB.
- **User data** — Profile (name, phone, address) is saved via `PUT /api/auth/me` and synced on app start with `GET /api/auth/me`.
- **Products** — Fetched from `GET /api/products`; fallback to local data if the server is unreachable.
- **Orders & payment** — Checkout uses Stripe (Payment Intents) and `POST /api/orders` to create orders; backend stores orders and handles Stripe webhooks.

**Configuration:**

- **API URL**: `src/config/apiConfig.js` — `API_BASE_URL_OVERRIDE`. Leave `null` for production (`https://api.azmarino.online`); set to `http://10.0.2.2:5000` for Android emulator + local backend.
- **Stripe**: In `App.tsx`, set `STRIPE_PUBLISHABLE_KEY` to your Stripe publishable key (test or live). Backend must use the same Stripe account and have `STRIPE_SECRET_KEY` and webhook secret set.
- **Login/Register logo**: Replace `src/assets/AzmarinoLOGO.png` with your logo image (same filename). It is shown on the Login and Register screens.

## Why emulator and phone can show different content

The app does **not** use different code for emulator vs device. Differences usually come from:

1. **Network / API**
   - **Emulator** often has no internet or can’t reach `https://api.azmarino.online`. Then product requests fail and the app shows **fallback products** (local list from `src/data/products`).
   - **Phone** on real Wi‑Fi/mobile data reaches the API and shows **live products** from the backend.
   - So: different product lists, images, or “server unreachable” banner on one device only.

2. **Stored data (AsyncStorage)**
   - Login state, language, theme, and cart are stored **per device**. Emulator has one set, your phone another. So you may see logged in on one and logged out on the other, or different language/theme.

3. **Build / bundle**
   - If you run the app on the phone from an older install, it may be using an **older JS bundle**. Emulator often gets the latest from Metro. Reinstall on the phone (`npx react-native run-android` with device connected) to get the same code.

**To make them match:**
- Use the **same API**: leave `API_BASE_URL_OVERRIDE = null` so both use production, or fix emulator network so it can reach the API.
- **Backend must return sizes and colors** for each product so the phone (when it uses API data) shows full size/color choice like the emulator. Deploy the latest `azmarino-backend` so `/api/products` includes `sizes` and `colors` (and optionally `images`) per product.
- **Reinstall on the phone** so it runs the same bundle as the emulator.
- Optionally clear app data on one device (or log in and set language the same) so stored state is aligned.

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

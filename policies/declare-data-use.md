# Declare Data Use

Source: https://developer.android.com/privacy-and-security/declare-data-use
Retrieved: 2026-09-26

---

Skip to main content

/

-

Light theme

-

Dark theme

-

Device default

English

-
English

-
Deutsch

-
Español – América Latina

-
Français

-
Indonesia

-
Italiano

-
Polski

-
Português – Brasil

-
Tiếng Việt

-
Türkçe

-
Русский

-
עברית

-
العربيّة

-
فارسی

-
हिंदी

-
বাংলা

-
ภาษาไทย

-
中文 – 简体

-
中文 – 繁體

-
日本語

-
한국어

Android Studio

Sign in

-

Security

-

Privacy

- On this page
- General guidelines
- Location - Approximate location
- Precise location

- Personal info - Name
- Email address
- User IDs
- Address
- Phone number
- Race and ethnicity
- Political or religious beliefs
- Sexual orientation
- Other info

- Financial info - User payment info
- Purchase history
- Credit score
- Other financial info

- Health and fitness - Health info
- Fitness info

- Messages - Emails
- SMS or MMS
- Other messages

- Photos or videos - Photos
- Videos

- Audio files - Voice or sound recordings
- Music files
- Other audio files

- Files and docs
- Calendar
- Contacts
- App activity - App interactions
- In-app search history
- Installed apps
- Other user-generated content
- Other actions

- Web browsing
- App info and performance - Crash logs
- Diagnostics
- Other app performance data

- Device or other IDs
- Version history

-

Android Developers

-

Design & Plan

-

Security

-

Privacy

-

Guides

Was this helpful?

#
Declare your app's data use

Dismiss

Got it

Stay organized with collections

Save and categorize content based on your preferences.

- On this page
- General guidelines
- Location - Approximate location
- Precise location

- Personal info - Name
- Email address
- User IDs
- Address
- Phone number
- Race and ethnicity
- Political or religious beliefs
- Sexual orientation
- Other info

- Financial info - User payment info
- Purchase history
- Credit score
- Other financial info

- Health and fitness - Health info
- Fitness info

- Messages - Emails
- SMS or MMS
- Other messages

- Photos or videos - Photos
- Videos

- Audio files - Voice or sound recordings
- Music files
- Other audio files

- Files and docs
- Calendar
- Contacts
- App activity - App interactions
- In-app search history
- Installed apps
- Other user-generated content
- Other actions

- Web browsing
- App info and performance - Crash logs
- Diagnostics
- Other app performance data

- Device or other IDs
- Version history
-

Note: This page supplements the guidance on how to provide information for
Google Play's Data safety
section
when you publish an app to Google Play. It's recommended that you read the Help
Center article before you review this page.
The Play Console includes a Data safety form on the App content page. In
this form, you explain to users which types of user data your app collects and
shares. This information helps promote data transparency and user trust.

To help you fill out this form, this guide provides examples of places in your
app's code where your app may collect different types of user data. In
particular, it provides examples of permission declarations and API calls that
your app may use to collect or share a particular type of user data, which would
require you to declare that collection or sharing in the Data safety form.

The guide has the following format:

- The main headings list the different categories of data types that are
available in the Data safety form, along with a non-exhaustive list of ways
that your app, or a library included in your app, may access user data related
to that category.

- The sub-headings list the different data types that are available in the form,
to remind you of the data types that are part of a particular category.

While we are offering this guidance to make it easier for you to complete the
Data safety form, you alone are responsible for making complete and accurate
declarations in your app's Play store listing. Only you possess all the
information required to complete the Data safety form. Google cannot make
determinations on behalf of developers regarding how they collect or handle user
data based on their particular usage and practices. It's up to developers to
appropriately handle any user data that their apps collect or share. When we
become aware of a discrepancy between your app behavior and your declaration, we
may take appropriate action, including enforcement action.

The details in this guidance are subject to change as we continue working with
developers and to improve both developer and user experiences. For more
information, read this blog
post .

Note: Your app may include third-party SDKs and libraries that can access user
data. If a third-party SDK or library in your app collects or shares user data,
you must reflect this collection and sharing in the Data safety form.

## General guidelines

In addition to the specific suggestions listed in the following sections, there
may be more general indicators that your app, or a library included in your app,
collects or shares user data. These indicators include, but aren't limited to,
the following:

- UI components that hide text input, such as password entry fields.

- Workflows that request the user to authenticate using
biometrics .

- Forms and alerts that prompt the user to enter user data, confirm a
submission, or make a choice.

- Code that controls the behavior of a WebView
element in your app.

- Support for the autofill
framework .

- Use of the data access auditing APIs.

## Location

There are different ways that your app, or a library included in your app, may
access user data related to location. The following list provides several
examples but isn't exhaustive:

- Declares at least one of the following permissions:

- ACCESS_COARSE_LOCATION

- ACCESS_FINE_LOCATION

- ACCESS_MEDIA_LOCATION

- Derives location information from an IP address or access point name.

Note: On devices that run Android 14 and higher, details about your location
data collection and sharing practices appear in the runtime system permission
dialog . Learn more about how data safety
information is more visible in
Android 14.

### Approximate location

User or device physical location to an area greater than or equal to 3 square
kilometers, such as the city a user is in, or location provided by Android's
ACCESS_COARSE_LOCATION permission.

### Precise location

User or device physical location within an area less than 3 square kilometers,
such as location provided by Android's ACCESS_FINE_LOCATION permission.

## Personal info

There are different ways that your app, or a library included in your app, may
access user data related to personal information. The following list provides
several examples but isn't exhaustive:

- Declares at least one of the following permissions:

- BIND_AUTOFILL_SERVICE

- GET_ACCOUNTS

- Uses the AccountManager API.

### Name

How a user refers to themselves, such as their first or last name, or nickname.

### Email address

A user's email address.

### User IDs

User IDs that relate to an identifiable person. For example, an account ID,
account number, or account name.

### Address

A user's address, such as a mailing or home address.

### Phone number

A user's phone number.

In addition to the broader suggestions listed at the beginning of this
section , there may be more specific indicators that your app,
or a library included in your app, collects or shares a user's phone number.
These indicators include, but aren't limited to, the following:

- Declares at least one of the following permissions:

- READ_CALL_LOG

- READ_PHONE_NUMBERS

- READ_PHONE_STATE ,
if your app targets Android 10 (API level 29) or lower

- READ_SMS

- Requests user
consent to
become the device's default dialer app or default SMS app.

- Has carrier
privileges .

Note: Google Play restricts the use of certain call log permissions unless your
app satisfies a particular set of requirements. Learn more about the policy
regarding use of SMS or call log permission
groups .

### Race and ethnicity

Information about a user's race or ethnicity.

### Political or religious beliefs

Information about a user's political or religious beliefs.

### Sexual orientation

Information about a user's sexual orientation.

### Other info

Any other personal information. For example, a user's date of birth, gender
identity, or veteran status.

## Financial info

There are different ways that your app, or a library included in your app, may
access user data related to financial information. The following list provides
several examples but isn't exhaustive:

- Uses Google Play's Billing Library .

- Uses the Google Pay
APIs.

- Declares the
BIND_AUTOFILL_SERVICE
permission and uses the autofill
framework .

### User payment info

Information about a user's financial accounts such as credit card number.

### Purchase history

Information about purchases or transactions a user has made.

### Credit score

Information about a user's credit. For example, their credit history or credit
score.

### Other financial info

Any other financial information. For example, a user's salary or debts.

## Health and fitness

There are different ways that your app, or a library included in your app, may
access user data related to health & fitness. The following list provides
several examples but isn't exhaustive:

- Declares at least one of the following permissions:

- ACTIVITY_RECOGNITION

- BODY_SENSORS

- BODY_SENSORS_BACKGROUND

- Uses at least one of the following APIs:

- Health Connect

- Google Fit

- Sleep

### Health info

Information about a user's health, such as medical records or symptoms.

### Fitness info

Information about a user's fitness, such as exercise or other physical activity.

## Messages

There are different ways that your app, or a library included in your app, may
access user data related to messages. The following list provides several
examples but isn't exhaustive:

- Declares at least one of the following permissions:

- READ_SMS

- RECEIVE_MMS

- RECEIVE_SMS

- RECEIVE_WAP_PUSH

- SEND_SMS

- WRITE_SMS depending on developer usage

Note: Google Play restricts the use of certain SMS permissions unless your app
satisfies a particular set of requirements. Learn more about the policy
regarding use of SMS or call log permission
groups .

### Emails

A user's emails including the email subject line, sender, recipients, and the
content of the email.

### SMS or MMS

A user's text messages including the sender, recipients, and the content of the
message.

### Other messages

Any other types of messages. For example, instant messages or chat content.

## Photos or videos

There are different ways that your app, or a library included in your app, may
access user data related to photos or videos. The following list provides
several examples but isn't exhaustive:

- Uses the system photo picker .

- Declares at least one of the following permissions:

- READ_EXTERNAL_STORAGE

- READ_MEDIA_IMAGES

- READ_MEDIA_VIDEO

- READ_MEDIA_AUDIO

- WRITE_EXTERNAL_STORAGE

- Provides a workflow for handling media
files .

- Record HDR video content .

### Photos

A user's photos.

### Videos

A user's videos.

## Audio files

There are different ways that your app, or a library included in your app, may
access user data related to audio files. The following list provides several
examples but isn't exhaustive:

- Declares at least one of the following permissions:

- CAPTURE_AUDIO_OUTPUT

- RECORD_AUDIO

- READ_EXTERNAL_STORAGE

- WRITE_EXTERNAL_STORAGE

- Provides a workflow for handling media
files .

### Voice or sound recordings

A user's voice such as a voicemail or a sound recording.

### Music files

A user's music files.

### Other audio files

Any other user-created or user-provided audio files.

## Files and docs

There are different ways that your app, or a library included in your app, may
access user data related to files and docs. The following list provides several
examples but isn't exhaustive:

- Declares at least one of the following permissions:

- READ_EXTERNAL_STORAGE

- WRITE_EXTERNAL_STORAGE

- MANAGE_EXTERNAL_STORAGE

- Provides a workflow for data and file storage .

- Provides a workflow for data backup .

Note: Google Play restricts the use of the MANAGE_EXTERNAL_STORAGE permission
unless your app satisfies a particular set of requirements. Learn more about the
policy regarding use of all files access (MANAGE_EXTERNAL_STORAGE)
permission .

## Calendar

There are different ways that your app, or a library included in your app, may
access user data related to the user's calendar. The following list provides
several examples but isn't exhaustive:

- READ_CALENDAR

- WRITE_CALENDAR

## Contacts

There are different ways that your app, or a library included in your app, may
access user data related to the user's contacts. The following list provides
several examples but isn't exhaustive:

- Declares at least one of the following permissions:

- ACCEPT_HANDOVER

- ADD_VOICEMAIL

- ANSWER_PHONE_CALLS

- CALL_PHONE

- PROCESS_OUTGOING_CALLS

- READ_CALL_LOG

- READ_CONTACTS

- READ_PHONE_NUMBERS

- READ_PHONE_STATE

- READ_SMS

- RECEIVE_MMS

- RECEIVE_SMS

- RECEIVE_WAP_PUSH

- SEND_SMS

- WRITE_CONTACTS

## App activity

There are different ways that your app, or a library included in your app, may
access user data related to the user's app activity. The following list provides
several examples but isn't exhaustive:

- Binds to a system service, such as
AccessibilityService
or TextService .

- Declares the
QUERY_ALL_PACKAGES
permission and calls getInstalledApplications()
or similar methods.

- Creates a search interface.

- Supports the Google Shortcuts Integration
Library .

- Uses the Instrumentation API.

Note: Google Play restricts the use of certain APIs and permissions
unless your app satisfies a particular set of requirements. Learn more about
these policies:

- Use
of the AccessibilityService API .

- Use
of the broad package (App) visibility (QUERY_ALL_PACKAGES)
permission .

### App interactions

Information about how a user interacts with your app. For example, the number of
times they visit a page, or what they tap on.

### In-app search history

Information about what a user has searched for in your app.

### Installed apps

Information about the apps installed on a user's device.

### Other user-generated content

Any other user-generated content not listed here, or in any other section. For
example, user bios, notes, or open-ended responses.

### Other actions

Any other user actions not listed here. For example, gameplay information
likes, or dialog options.

## Web browsing

There are different ways that your app, or a library included in your app, may
access user data related to web browsing. The following list provides several
examples but isn't exhaustive:

- Sends requests to users to make your app the default browser app.

- Maintains a browsing cache or cookies.

- Creates a search interface .

## App info and performance

There are different ways that your app, or a library included in your app, may
access user data related to app info and performance. The following list
provides several examples but isn't exhaustive:

- Declares the
BATTERY_STATS
permission.

- Uses APIs such as the following:

- ActivityManager

- ApplicationErrorReport

- ApplicationExitInfo

- `ASurfaceControl

- BatteryManager

- Benchmark

- Choreographer

- Debug

- HealthStats

- Macrobenchmark

- PowerManager

- StrictMode

- Calls methods such as the following:

- getAudioDevicesForAttributes()
and
getDirectProfilesForAttributes()
from the AudioManager API.

### Crash logs

Crash log data from your app. For example, the number of times your app has
crashed, stack traces, or other information directly related to a crash.

### Diagnostics

Information about the performance of your app. For example: battery life,
loading time, latency, framerate, or any technical diagnostics.

### Other app performance data

Any other app performance data not listed here.

## Device or other IDs

Examples of these IDs include: an IMEI
number , MAC
address , Widevine Device
ID ,
Firebase installation
ID ,
or advertising
identifier .

There are different ways that your app, or a library included in your app, may
access user data related to device or other IDs. The following list
provides several examples but isn't exhaustive:

- Declares at least one of the following permissions:

- AD_ID
(Google Play services permission)

- READ_PRIVILEGED_PHONE_STATE

- Uses API such as AdvertisingIdClient .

- Derives device or other identifier information from an IP address or access
point name.

## Version history

The following table provides a summary of changed content on this page:

Date

Description of change

December 13 2022

Updated the location, health and fitness, photos and videos, app info
and performance, and device or other IDs categories to mention the
capabilities introduced in Android 13.

February 24, 2022

Changed the name of the Device or other identifiers data type
category to Device or other IDs . Changed the names and descriptions
of several data types, including data types in the Personal info ,
Financial info , Health and fitness , Messages , and
App activity categories.

January 4, 2022

Updated the "Sexual orientation and gender identity" data type. This
data type now refers to only sexual
orientation . Gender identity is now an example of other personal
information.

October 18, 2021

Initial version published.

Was this helpful?

Content and code samples on this page are subject to the licenses described in the Content License . Java and OpenJDK are trademarks or registered trademarks of Oracle and/or its affiliates.

Last updated 2026-03-06 UTC.

Help us improve the Android Developer experience by taking a survey.
No, thanks Take survey
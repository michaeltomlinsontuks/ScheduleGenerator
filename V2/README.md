# University of Pretoria Schedule Generator V2

This application automates the process of adding your University of Pretoria (UP) class and test schedules to your Google Calendar. It parses official UP PDF schedules, intelligently maps modules to specific colors, and adds the events directly to your calendar via the Google Calendar API, including recurring weekly events.

The system includes a mandatory preview and approval step to ensure your calendar is never populated with incorrect data.

## Features

- **Direct PDF Parsing**: Handles both recurring weekly schedules and one-time test schedules from official UP PDF files.
- **Google Calendar Integration**: Adds events directly to your primary Google Calendar. No more manual `.ics` file imports.
- **Automatic Color-Coding**: Assigns specific colors to different modules for easy visual organization.
- **Recurring Events**: Automatically creates weekly recurring events for the entire duration of the semester.
- **Mandatory Preview**: Shows a full summary of all events that will be added and requires your approval before making any changes to your calendar.
- **User-Friendly CLI**: A simple command-line interface guides you through the entire process.
- **Persistent Authentication**: You only need to authorize the application with your Google account once.

---

## How to Use

### 1. Prerequisites

- Python 3.8+
- A UP schedule in PDF format.

### 2. Initial Setup

Follow these steps to set up the application for the first time. **Ensure you are in the root directory of the `ScheduleGenerator` project before starting.**

```bash
# Navigate into the V2 directory
cd V2

# Create a virtual environment named 'venv' inside the V2 directory
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install required Python packages into the virtual environment
pip install -r requirements.txt
```

### 3. Google Calendar API Setup (One-Time Only)

To allow the application to add events to your calendar, you must authorize it. This involves getting a `credentials.json` file from the Google Cloud Console.

1.  **Go to the Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a New Project**: If you don't have one already, create a new project.
3.  **Enable the Google Calendar API**:
    -   Navigate to **APIs & Services > Library**.
    -   Search for "Google Calendar API" and click **Enable**.
4.  **Configure the OAuth Consent Screen**:
    -   Go to **APIs & Services > OAuth consent screen**.
    -   For **User Type**, select **External** and click **Create**. This means your app will be available to any Google user with a Google Account. For personal use, this is sufficient, and you won't need to go through the verification process.
    -   **OAuth consent screen configuration**:
        -   **App Information**:
            -   App name: `UP Schedule Generator` (or any name you prefer)
            -   User support email: Your email address.
            -   Developer contact information: Your email address.
        -   Click **SAVE AND CONTINUE**.
    -   **Scopes**:
        -   On the "Scopes" page, you don't need to add any scopes manually here. The application will request the necessary scopes during the first run.
        -   Click **SAVE AND CONTINUE**.
    -   **Test Users**:
        -   On the "Test users" page, click **+ ADD USERS**.
        -   Add the Google account email address(es) for the calendar(s) you want to modify. **This is a critical step for testing mode.**
        -   Click **SAVE AND CONTINUE**.
    -   **Summary**: Review the summary and click **BACK TO DASHBOARD**. Your publishing status should be "Testing".

5.  **Create Credentials**:
    -   Go to **APIs & Services > Credentials**.
    -   Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID** from the dropdown.
    -   For **Application type**, select **Desktop app**. This type is suitable for applications that run on a user's computer.
    -   Give your client ID a descriptive name, such as `ScheduleGeneratorCLI`.
    -   Click **Create**.
6.  **Download and Save Credentials**:
    -   A window will pop up displaying your client ID and client secret.
    -   Click the **DOWNLOAD JSON** button. This will download a file named `client_secret_YOUR_CLIENT_ID.json` (or similar).
    -   **Rename** the downloaded file to `credentials.json`.
    -   **Place this `credentials.json` file inside the `V2` directory of this project.** This file contains sensitive information and should be kept secure and not shared publicly or committed to version control.

### 4. Running the Application

Once the setup is complete and you have placed your `credentials.json` file in the `V2` directory, you can run the application from your terminal. **Ensure you are in the `V2` directory and your virtual environment is active.**

```bash
# Make sure you are in the V2 directory
cd V2

# Activate the virtual environment (if not already active)
source venv/bin/activate

# Run the application
venv/bin/python3 main.py
```

-   The script will first ask for the full path to your schedule PDF.
-   The first time you run it, a browser window will open, asking you to log in and grant the application permission to access your calendar.
-   After authentication, it will display a preview of all the events found.
-   Review the preview carefully. If it looks correct, type `yes` to add the events to your Google Calendar.

---

## Configuration

You can customize the application's behavior by editing the `V2/config.py` file.

### Semester Dates

Set the `SEMESTER_START_DATE` and `SEMESTER_END_DATE` to define the period for which recurring weekly events will be created.

```python
# V2/config.py

SEMESTER_START_DATE = datetime(2025, 7, 21)
SEMESTER_END_DATE = datetime(2025, 11, 14)
```

### Color Mapping for Modules

Yes, the application automatically maps modules to specific colors in your Google Calendar. You can configure these colors in the `MODULE_COLORS` dictionary within `V2/config.py`.

The script uses the module prefix (e.g., "COS", "STK") to determine the color. If a module doesn't have a specific color defined, it will use the `Default` color.

```python
# V2/config.py

MODULE_COLORS = {
    "COS": "Blueberry",
    "STK": "Sage",
    "WTW": "Grape",
    "Default": "Graphite"
}
```

You can change these to any of the following supported Google Calendar color names:

-   `"Lavender"`
-   `"Sage"`
-   `"Grape"`
-   `"Flamingo"`
-   `"Banana"`
-   `"Tangerine"`
-   `"Peacock"`
-   `"Graphite"`
-   `"Blueberry"`
-   `"Basil"`
-   `"Default"` (This is the calendar's default color)

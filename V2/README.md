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

Follow these steps to set up the application for the first time.

**a. Clone the Repository**
If you haven't already, clone this repository to your local machine.

**b. Create a Virtual Environment**
It is highly recommended to run this application in a virtual environment to manage its dependencies.

```bash
# Navigate to the V2 directory
cd /path/to/ScheduleGenerator/V2

# Create a virtual environment
python3 -m venv venv
```

**c. Install Dependencies**
Activate the virtual environment and install the required Python packages.

```bash
# Activate the virtual environment
source venv/bin/activate

# Install packages from requirements.txt
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
    -   Select **External** and click **Create**.
    -   **App Information**:
        -   App name: `UP Schedule Generator`
        -   User support email: Your email address.
        -   Developer contact information: Your email address.
    -   **Scopes**: You can skip this page.
    -   **Test Users**: Click **Add Users** and add the Google account email address for the calendar you want to modify. **This is a critical step.**
5.  **Create Credentials**:
    -   Go to **APIs & Services > Credentials**.
    -   Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    -   Set the **Application type** to **Desktop app**.
    -   Give it a name, like `ScheduleGeneratorCLI`.
    -   Click **Create**.
6.  **Download and Save Credentials**:
    -   A window will appear. Click **DOWNLOAD JSON**.
    -   Rename the downloaded file to `credentials.json`.
    -   Place this `credentials.json` file inside the `V2` directory of this project.

### 4. Running the Application

Once the setup is complete, you can run the application from your terminal.

```bash
# Make sure you are in the V2 directory and your virtual environment is active
python3 main.py
```

-   The script will first ask for the path to your schedule PDF.
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

'use client';

import Link from 'next/link';
import { Button } from '@/components/common';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-bold text-base-content">
              Tuks Schedule Generator
            </h1>
            <p className="py-6 text-lg text-base-content/80">
              Transform your Tuks PDF schedule into calendar events.
              Upload your timetable, preview and customize your events, then export to
              ICS or sync directly with Google Calendar.
            </p>
            <Link href="/upload">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="py-16 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-base-content">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Upload PDF Card */}
            <div className="card card-border bg-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="card-title text-base-content">Upload PDF</h3>
                <p className="text-base-content/70">
                  Simply drag and drop your Tuks timetable PDF or click to browse.
                  We&apos;ll automatically extract all your classes and events.
                </p>
              </div>
            </div>

            {/* Preview Events Card */}
            <div className="card card-border bg-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">👁️</div>
                <h3 className="card-title text-base-content">Preview Events</h3>
                <p className="text-base-content/70">
                  Review all extracted events grouped by day. Select which classes
                  to include and filter by module.
                </p>
              </div>
            </div>

            {/* Export Calendar Card */}
            <div className="card card-border bg-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="card-title text-base-content">Export Calendar</h3>
                <p className="text-base-content/70">
                  Customize colors for each module, set your semester dates,
                  then download as ICS or sync to Google Calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

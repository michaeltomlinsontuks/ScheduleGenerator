'use client';

import React from 'react';
import Link from 'next/link';

interface VersionSection {
    version: string;
    title: string;
    period: string;
    color: 'primary' | 'secondary' | 'accent';
    content: {
        heading?: string;
        items: string[];
    }[];
}

const timelineData: VersionSection[] = [
    {
        version: 'V1',
        title: 'Initial Exploration',
        period: '2nd Semester 1st Year → 1st Semester 2nd Year',
        color: 'primary',
        content: [
            {
                heading: 'Learning Phase',
                items: [
                    'Looked at formatted selectable text',
                    'Learning what LaTeX was at the time',
                    'Knew Python libraries existed for PDF parsing',
                ],
            },
            {
                heading: 'First Implementation',
                items: [
                    'Tried using tools for parsing into CSV (ILovePDF)',
                    'Good but made occasional mistakes',
                    'V1 focused on turning this CSV into an .ics',
                ],
            },
            {
                heading: 'Limitations',
                items: [
                    'No recurring events',
                    'No colours',
                ],
            },
        ],
    },
    {
        version: 'V2',
        title: 'CLI Overhaul',
        period: '2nd Semester 2nd Year',
        color: 'secondary',
        content: [
            {
                heading: 'Context',
                items: [
                    'AI had come a long way',
                    'My skills in development and AI prompting had come a long way',
                    'I made CLIs for various assignments',
                ],
            },
            {
                heading: 'Goals',
                items: [
                    'Make the app usable',
                    'Contained (no outside tools used)',
                    'Use OAuth to directly add to Calendar',
                ],
            },
            {
                heading: 'Development',
                items: [
                    'Figured out which PDF parsing libraries to use',
                    'Went back and forth with a text output',
                    'Researched and learnt OAuth',
                ],
            },
            {
                heading: 'Results',
                items: [
                    'Got a tool that would make events in my calendar',
                    'Perfect for personal use',
                    'Recurring events ✓',
                    'Colours ✓',
                    'Tests ✓',
                ],
            },
        ],
    },
    {
        version: 'V3',
        title: 'Website Setup',
        period: 'Current Version',
        color: 'accent',
        content: [
            {
                heading: 'Motivation',
                items: [
                    'Moving to a hosted website',
                    'Accessible for friends',
                    'Portfolio work',
                    'Learning server hosting etc.',
                ],
            },
            {
                heading: 'Initial Design (Over-engineered)',
                items: [
                    'Nest API',
                    'PdfParser container (Python)',
                    'Next Frontend',
                    'S3 Blob Storage - temporary bulk holding for PDFs',
                    'BullMQ - handles job queuing for concurrent requests',
                    'Postgres - job tracking',
                    'Redis - hosts BullMQ',
                ],
            },
            {
                heading: 'Issue',
                items: [
                    'Way over-engineered for expected max users (~20,000 in the whole university)',
                    'Went with Fly.io for dynamic hosting',
                    'Handles container-based scaling already',
                    'Requires additional costs for Postgres, S3, Redis',
                    'Lots of IP config for this strategy',
                ],
            },
            {
                heading: 'Simplification',
                items: [
                    'Removed BullMQ and S3',
                    'Converted PDF processing to be synchronous',
                    'Slower per user but way less overhead',
                    'Fly.io should handle scaling in theory',
                ],
            },
            {
                heading: 'Takeaways',
                items: [
                    'Good UI is hard',
                    'DNS config has a lot of subtle issues (Google OAuth allowed domains, Fly.io domain certificates, .envs, secrets, testing domains)',
                    'Hosting has a lot of decisions with cascading consequences',
                ],
            },
        ],
    },
];

function VersionCard({ section }: { section: VersionSection }) {
    const colorClasses = {
        primary: 'border-l-primary',
        secondary: 'border-l-secondary',
        accent: 'border-l-accent',
    };

    const badgeClasses = {
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        accent: 'badge-accent',
    };

    return (
        <div className={`card bg-base-200 border border-base-300 border-l-4 ${colorClasses[section.color]} shadow-sm`}>
            <div className="card-body">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <span className={`badge ${badgeClasses[section.color]} badge-lg font-bold`}>
                        {section.version}
                    </span>
                    <div>
                        <h2 className="text-xl font-bold">{section.title}</h2>
                        <p className="text-sm text-base-content/60">{section.period}</p>
                    </div>
                </div>

                {/* Content sections */}
                <div className="space-y-4">
                    {section.content.map((block, idx) => (
                        <div key={idx}>
                            {block.heading && (
                                <h3 className="font-semibold text-base-content/80 mb-2">{block.heading}</h3>
                            )}
                            <ul className="space-y-1 ml-4">
                                {block.items.map((item, itemIdx) => (
                                    <li key={itemIdx} className="text-sm text-base-content/70 flex items-start gap-2">
                                        <span className="text-base-content/40 mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function CVPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            {/* Hero Section */}
            <div className="text-center mb-10">
                <h1 className="text-2xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Development Journey
                </h1>
                <p className="text-base-content/70">
                    The evolution of the Tuks Schedule Generator
                </p>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                {timelineData.map((section) => (
                    <VersionCard key={section.version} section={section} />
                ))}
            </div>

            {/* Footer CTA */}
            <div className="mt-10 text-center">
                <div className="card bg-base-200 border border-base-300">
                    <div className="card-body items-center py-6">
                        <p className="text-base-content/70 mb-3">
                            Want to try it out?
                        </p>
                        <div className="flex gap-3">
                            <Link href="/" className="btn btn-primary btn-sm">
                                Back to Home
                            </Link>
                            <a
                                href="https://github.com/michaeltomlinsontuks/ScheduleGenerator"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm"
                            >
                                View Source
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

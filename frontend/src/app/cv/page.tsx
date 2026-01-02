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
        title: 'Problem Discovery',
        period: 'Late 2024 → Early 2025',
        color: 'primary',
        content: [
            {
                heading: 'The Problem',
                items: [
                    'University schedules distributed as PDF files compiled from LaTeX',
                    'Manual calendar entry was tedious and error-prone',
                    'Existing PDF-to-CSV tools made parsing mistakes',
                ],
            },
            {
                heading: 'Initial Solution',
                items: [
                    'Built a Python script to convert extracted CSV data into .ics calendar files',
                    'Learned PDF structure and how LaTeX compiles to formatted output',
                ],
            },
            {
                heading: 'Limitations Identified',
                items: [
                    'No support for recurring events',
                    'No colour-coding for different class types',
                    'Still relied on third-party PDF extraction tools',
                ],
            },
        ],
    },
    {
        version: 'V2',
        title: 'CLI Tool & API Integration',
        period: 'Late 2025',
        color: 'secondary',
        content: [
            {
                heading: 'Goals',
                items: [
                    'Eliminate all external dependencies',
                    'Direct integration with Google Calendar API',
                    'Reliable, repeatable PDF parsing',
                ],
            },
            {
                heading: 'Technical Implementation',
                items: [
                    'Reverse-engineered LaTeX-compiled PDF structure for accurate column extraction',
                    'Implemented Google OAuth 2.0 authentication flow (unverified - personal use only)',
                    'Built CLI interface with full test coverage',
                ],
            },
            {
                heading: 'API Lessons Learned',
                items: [
                    'Initial App Script approach hit Google rate limits',
                    'Redesigned to handle API throttling gracefully',
                    'Understood OAuth scopes and token management',
                ],
            },
            {
                heading: 'Results',
                items: [
                    'Fully automated schedule-to-calendar pipeline',
                    'Support for recurring events and colour-coding',
                    'Robust error handling for edge cases in PDF parsing',
                ],
            },
        ],
    },
    {
        version: 'V3',
        title: 'Web Application & DevOps',
        period: 'Late 2025 → Present',
        color: 'accent',
        content: [
            {
                heading: 'Motivation',
                items: [
                    'Make the tool accessible to other students',
                    'Learn production deployment and infrastructure',
                    'Build portfolio piece demonstrating full-stack skills',
                ],
            },
            {
                heading: 'Architecture Evolution',
                items: [
                    'Initial over-engineered design: NestJS API, Python PDF container, S3, BullMQ, Postgres, Redis',
                    'Recognized complexity exceeded requirements for ~20k potential users',
                    'Simplified to synchronous processing with Fly.io\'s built-in scaling',
                ],
            },
            {
                heading: 'Infrastructure & DevOps',
                items: [
                    'Containerized services deployed on Fly.io',
                    'Configured SSL certificates and custom domain',
                    'Managed environment secrets across development and production',
                ],
            },
            {
                heading: 'OAuth Production Verification',
                items: [
                    'Completed Google OAuth verification process for public access',
                    'Navigated strict requirements (privacy policy, terms of service, scope justification)',
                    'Learned about Google\'s security review process',
                ],
            },
            {
                heading: 'Key Learnings',
                items: [
                    'Trade-offs between architectural complexity and operational overhead',
                    'DNS configuration nuances: OAuth domains, SSL certificates, environment parity',
                    'Importance of iterating on UI based on real user feedback',
                    'Used AI-assisted development (Antigravity) for rapid frontend prototyping',
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

import Link from 'next/link';
import React from 'react';

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">About</h1>

            <div className="card bg-base-200 shadow-xl border border-base-300">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="avatar">
                            <div className="w-24 rounded-full">
                                <img src="/pfp.png" alt="Michael Tomlinson" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="card-title text-2xl">The Developer</h2>
                            <div className="prose max-w-none">
                                <p className="text-lg">
                                    I am a third year computer science student. I originally made this tool for myself in CLI form to manage my own schedule.
                                </p>
                                <p className="text-lg">
                                    I decided to make it available to the general student population as a pet project to help others.
                                </p>
                                <div className="alert alert-soft alert-info mt-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>
                                        <strong>Zero Data Policy:</strong> I don't store anything because I don't care. Your data is yours.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-actions justify-end mt-6">
                        <Link href="/" className="btn btn-primary">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-200 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h3 className="card-title text-base-content/70">Open Source</h3>
                        <p>This project is open source. You can check the code to verify that "I don't care" claim.</p>
                        <div className="card-actions mt-4">
                            <a href="https://github.com/michaeltomlinsontuks/ScheduleGenerator" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-200 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h3 className="card-title text-base-content/70">Contact</h3>
                        <p>Found a bug or have a suggestion? Feel free to reach out.</p>
                        <div className="card-actions mt-4">
                            <a href="mailto:michael@tomlinson.co.za" className="btn btn-sm btn-outline">
                                Email Me
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

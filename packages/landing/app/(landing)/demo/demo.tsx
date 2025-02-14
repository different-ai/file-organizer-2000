"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  RefreshCw,
  ChevronDown,
  Mic,
  Play,
  Square,
  Clock,
  Check,
  AlertCircle,
  Ban,
  Filter,
  Calendar,
  Search,
  Monitor,
  Wallet,
} from "lucide-react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { BrowserWindow } from "./browser-window";
import { motion, AnimatePresence } from "framer-motion";
import { ValueJourney } from "../components/value-journey";

const tabs = [
  { id: "organizer", label: "Organizer" },
  { id: "inbox", label: "Inbox" },
  { id: "meetings", label: "Meetings" },
  { id: "chat", label: "Chat" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export const Demo = () => {
  const [activeTab, setActiveTab] = useState<Tab>("organizer");
  const [isRecording, setIsRecording] = useState(false);

  const renderMeetingsContent = () => {
    return (
      <div className="p-4">
        <div className="space-y-6">
          {/* Recording Section */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isRecording ? "bg-red-500 animate-pulse" : "bg-muted"
                  }`}
                />
                <h3 className="text-lg font-medium">Meeting Recorder</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
            </div>
            {isRecording && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Recording: 00:02:45
                  </span>
                </div>
                <Badge variant="secondary">Live Transcription Active</Badge>
              </div>
            )}
          </div>

          {/* Recent Recordings */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-medium mb-4">Recent Recordings</h3>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">
                      Team Sync - Product Review
                    </span>
                  </div>
                  <Badge variant="secondary">5 min ago</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration: 45:12
                  </span>
                  <Button variant="outline" size="sm">
                    Enhance Notes
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">
                      Client Meeting - Project Kickoff
                    </span>
                  </div>
                  <Badge variant="secondary">Yesterday</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration: 32:18
                  </span>
                  <Button variant="outline" size="sm">
                    Enhance Notes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrganizerContent = () => {
    return (
      <div className="p-4">
        <div className="space-y-6">
          {/* AI Templates Section */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <span role="img" aria-label="robot" className="mr-2">🤖</span>
                AI Templates
              </h3>
              <Button variant="outline" size="sm">Apply Template</Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Template:</span>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground">Meeting Notes Pro</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                <p className="text-muted-foreground">This template will:</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Structure content with clear headings</li>
                  <li>Extract and format action items</li>
                  <li>Highlight key decisions</li>
                  <li>Add metadata (date, attendees)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span role="img" aria-label="tags" className="mr-2">🏷️</span>
                <h3 className="text-lg font-medium">AI Tags</h3>
              </div>
              <Badge variant="secondary">3 suggestions</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/5">#mobile-app</Badge>
                <Badge variant="outline" className="bg-primary/5">#user-feedback</Badge>
                <Badge variant="outline" className="bg-primary/5">#q4-planning</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Tags suggested based on note content analysis</p>
            </div>
          </div>

          {/* Folders Section */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span role="img" aria-label="folder" className="mr-2">📁</span>
                <h3 className="text-lg font-medium">Suggested Location</h3>
              </div>
              <Button variant="outline" size="sm">Move</Button>
            </div>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium">Projects/Mobile App/Meetings</div>
                <p className="text-xs text-muted-foreground mt-1">Based on content similarity and existing structure</p>
              </div>
            </div>
          </div>

          {/* Atomic Notes Section */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span role="img" aria-label="scissors" className="mr-2">✂️</span>
                <h3 className="text-lg font-medium">Atomic Notes</h3>
              </div>
              <Badge variant="secondary">4 chunks detected</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium">Suggested splits:</div>
                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                  <li>Mobile App Redesign Requirements</li>
                  <li>Q4 Timeline Updates</li>
                  <li>User Feedback Analysis</li>
                  <li>Performance Optimization Plan</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full">Split into Atomic Notes</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInboxContent = () => {
    return (
      <div className="p-4 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Queued</div>
            <div className="mt-2">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Processing</div>
            <div className="mt-2">
              <Play className="h-5 w-5 mx-auto text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">77</div>
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="mt-2">
              <Check className="h-5 w-5 mx-auto text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files, tags, or actions..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-sm">
              <Filter className="h-4 w-4 mr-2" />
              All Status
            </Button>
            <Button variant="outline" size="sm" className="text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              All time
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="line-through text-muted-foreground">
                  Recording 20240808120009
                </span>
                <span className="text-sm">→</span>
                <span className="text-primary">
                  Email Processing and Filtering Overview
                </span>
              </div>
              <span className="text-green-500">●</span>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="mr-2">
                #email
              </Badge>
              <Badge variant="outline" className="mr-2">
                #workflow
              </Badge>
              <Badge variant="outline">#communication</Badge>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="line-through text-muted-foreground">
                  Untitled 37
                </span>
                <span className="text-sm">→</span>
                <span className="text-primary">
                  Email Routing Issues and Encoding Conversion
                </span>
              </div>
              <span className="text-green-500">●</span>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="mr-2">
                #email
              </Badge>
              <Badge variant="outline" className="mr-2">
                #issue
              </Badge>
              <Badge variant="outline">#encoding</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChatContent = () => {
    return (
      <div className="p-4 space-y-6">
        {/* Chat Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span role="img" aria-label="ai" className="text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-medium">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">Processing video content...</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto rounded-lg border border-border p-4 bg-gradient-to-b from-background to-background/80">
          {/* User Message */}
          <div className="flex items-start justify-end space-x-2">
            <div className="max-w-[80%] text-primary-foreground rounded-lg p-3">
              <p>Could you summarize this YouTube video and add it to my current note?</p>
              <div className="mt-2 text-sm bg-primary-foreground/10 rounded p-2">
                <span className="text-blue-300">https://www.youtube.com/watch?v=2lf31DruBsg</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center">
              <span role="img" aria-label="user" className="text-sm">👤</span>
            </div>
          </div>

          {/* System Message */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded border border-border">
              YouTube transcript successfully retrieved
            </span>
          </div>

          {/* AI Message */}
          <div className="flex items-start space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span role="img" aria-label="ai" className="text-sm">🤖</span>
            </div>
            <div className="max-w-[80%] bg-card border border-border rounded-lg p-3">
              <div className="space-y-2">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-background rounded w-3/4"></div>
                  <div className="h-4 bg-background rounded w-1/2"></div>
                  <div className="h-4 bg-background rounded w-5/6"></div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Processing video content and generating summary...
                </div>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          <div className="flex items-center justify-center space-x-4 bg-card border border-border rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm">Extracting key points</span>
            </div>
            <div className="text-sm text-muted-foreground">|</div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-muted rounded-full"></div>
              <span className="text-sm text-muted-foreground">Formatting notes</span>
            </div>
            <div className="text-sm text-muted-foreground">|</div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-muted rounded-full"></div>
              <span className="text-sm text-muted-foreground">Adding to document</span>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask a question about the video or provide additional context..."
              className="w-full pl-4 pr-10 py-2 bg-background rounded-lg border border-border"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline">Send</Button>
        </div>

        {/* Enhancement Options */}
        <div className="grid grid-cols-3 gap-4">
          <Button variant="outline" className="flex items-center justify-center space-x-2 bg-background/50">
            <span role="img" aria-label="summary" className="text-lg">📝</span>
            <span>Summary</span>
          </Button>
          <Button variant="outline" className="flex items-center justify-center space-x-2 bg-background/50">
            <span role="img" aria-label="key points" className="text-lg">🎯</span>
            <span>Key Points</span>
          </Button>
          <Button variant="outline" className="flex items-center justify-center space-x-2 bg-background/50">
            <span role="img" aria-label="action items" className="text-lg">✅</span>
            <span>Action Items</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderTabExplanation = (tab: Tab) => {
    const explanations = {
      organizer: {
        emoji: "🎯",
        title: "AI-Powered File Organization",
        description: "Your personal file librarian that understands context",
        benefits: [
          "Turn messy notes into clean, structured docs",
          "Auto-tag everything based on content",
          "Split long docs into atomic notes",
        ],
      },
      inbox: {
        emoji: "📥",
        title: "Smart Processing Queue",
        description: "Drop files in, let AI do the heavy lifting",
        benefits: [
          "Never organize files manually again",
          "Perfect for processing email exports",
          "Handles PDFs, images, and documents",
        ],
      },
      meetings: {
        emoji: "🎙️",
        title: "Meeting Notes Enhancement",
        description: "Focus on the conversation, we'll handle the notes",
        benefits: [
          "Record & transcribe with one click",
          "Get a TLDR of every meeting",
          "Never miss action items",
        ],
      },
      chat: {
        emoji: "🤖",
        title: "Context-Aware AI Assistant",
        description: "Like ChatGPT, but it knows your notes",
        benefits: [
          "Summarize YouTube videos instantly",
          "Get answers from your notes",
          "Generate content that matches your style",
        ],
      },
    } as const;

    const info = explanations[tab];

    return (
      <div className="bg-blue-500/10 border-b border-border">
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Functionality Overview</p>
          <div className="flex items-start gap-4">
            <div className="text-3xl">{info.emoji}</div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-semibold tracking-tight">
                {info.title}
              </h3>
              <p className="text-muted-foreground">{info.description}</p>
              <div className="flex flex-col gap-2 pt-2">
                {info.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    return (
      <div>
        {/* Tab Explanation */}
        {renderTabExplanation(activeTab)}

        {/* Tab Content */}
        <div className="p-4">
          {(() => {
            switch (activeTab) {
              case "organizer":
                return renderOrganizerContent();
              case "inbox":
                return renderInboxContent();
              case "meetings":
                return renderMeetingsContent();
              case "chat":
                return renderChatContent();
              default:
                return null;
            }
          })()}
        </div>
      </div>
    );
  };

  return (
    <BrowserWindow>
    
      <div className="flex">
        {/* Left Sidebar - Markdown Editor */}
        <div className="hidden md:block w-[600px] border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="h-full flex flex-col">
            {/* File Header */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">📝 team-sync-notes.md</span>
                </div>
                {activeTab === "meetings" && (
                  <Button variant="outline" size="sm" onClick={() => setIsRecording(!isRecording)}>
                    {isRecording ? "Processing..." : "Enhance Note"}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Editor Content */}
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
              <div className="space-y-4">
                {activeTab === "meetings" && !isRecording ? (
                  // Unformatted Note
                  <div className="space-y-4 text-muted-foreground">
                    <div>team sync meeting march 15</div>
                    <div>attendees: john, sarah, mike, lisa</div>
                    <div>
                      discussed mobile app redesign - user metrics show increasing mobile usage need to prioritize this
                      talked about q4 roadmap and timeline updates needed
                      user feedback review showed main pain points: navigation complexity, performance on older devices
                    </div>
                    <div>
                      action items
                      - schedule design team followup
                      - share notes w/ stakeholders
                      - update project timeline
                      - review user feedback in detail
                    </div>
                    <div>
                      next steps
                      mobile first approach
                      simplified nav structure
                      performance optimization sprint
                    </div>
                  </div>
                ) : (
                  // Formatted Note
                  <>
                    <div>
                      <span className="text-primary"># Team Sync - Product Review</span>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">## Meeting Details</span>
                      <div className="pl-4 mt-2 space-y-1">
                        <span>**Date**: March 15, 2024</span>
                        <span>**Attendees**: John, Sarah, Mike, Lisa</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">## Key Discussions</span>
                      <div className="pl-4 mt-2 space-y-2">
                        <span>1. **Mobile App Redesign Priority**</span>
                        <div className="pl-4 text-muted-foreground">
                          - User engagement metrics show increasing mobile usage
                          - Need to focus on improving mobile experience
                          - Adopt mobile-first approach
                        </div>
                        <span>2. **User Feedback Analysis**</span>
                        <div className="pl-4 text-muted-foreground">
                          - Navigation complexity issues identified
                          - Performance concerns on older devices
                          - Simplified navigation structure proposed
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">## Action Items</span>
                      <div className="pl-4 mt-2 space-y-1">
                        <span>- [ ] Schedule follow-up with design team</span>
                        <span>- [x] Share meeting notes with stakeholders</span>
                        <span>- [ ] Update project timeline</span>
                        <span>- [ ] Conduct detailed user feedback review</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">## Next Steps</span>
                      <div className="pl-4 mt-2 space-y-1">
                        <span>1. Implement mobile-first approach</span>
                        <span>2. Redesign navigation structure</span>
                        <span>3. Plan performance optimization sprint</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">## Related Notes</span>
                      <div className="pl-4 mt-2 space-y-1">
                        <span className="text-blue-500">[[Q4 Planning]]</span>
                        <span className="text-blue-500">[[Mobile App Redesign]]</span>
                        <span className="text-blue-500">[[User Feedback Q1 2024]]</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">## Tags</span>
                      <div className="pl-4 mt-2 space-x-2">
                        <span className="text-blue-500">#product</span>
                        <span className="text-blue-500">#mobile</span>
                        <span className="text-blue-500">#q4-2024</span>
                        <span className="text-blue-500">#user-feedback</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-background text-foreground">
          <div className="border-b border-border">
            <div className="flex space-x-1 p-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm ${activeTab === tab.id ? "text-white" : ""}`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BrowserWindow>
  );
};

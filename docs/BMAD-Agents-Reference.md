# B-MAD Agents & Tasks - Complete Reference Guide

## Overview
This document provides a comprehensive reference for all B-MAD (Business-Minded Agile Development) agents and their capabilities. Each agent has a specific role with commands they can execute (using * prefix) and tasks they can perform.

---

## Agent List

### 1. /analyst - Mary (Business Analyst) 📊
**When to Use**: Market research, brainstorming, competitive analysis, creating project briefs, initial project discovery, and documenting existing projects (brownfield)

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*brainstorm {topic}` - Facilitate structured brainstorming session
- `*create-competitor-analysis` - Create competitive analysis document
- `*create-project-brief` - Create project brief document
- `*doc-out` - Output full document in progress
- `*elicit` - Run advanced elicitation
- `*perform-market-research` - Create market research document
- `*research-prompt {topic}` - Create deep research prompt
- `*yolo` - Toggle Yolo Mode
- `*exit` - Exit persona

**Tasks**:
1. **advanced-elicitation.md** - Provide reflective and brainstorming actions to enhance content quality through structured elicitation techniques
2. **create-deep-research-prompt.md** - Generate comprehensive research prompts for various types of deep analysis
3. **create-doc.md** - Create documents from YAML-driven templates with interactive section-by-section development
4. **document-project.md** - Generate comprehensive documentation for existing brownfield projects
5. **facilitate-brainstorming-session.md** - Facilitate interactive brainstorming sessions with various techniques

---

### 2. /architect - Winston (Architect) 🏗️
**When to Use**: System design, architecture documents, technology selection, API design, and infrastructure planning

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*create-backend-architecture` - Create backend architecture document
- `*create-brownfield-architecture` - Create brownfield architecture document
- `*create-front-end-architecture` - Create frontend architecture document
- `*create-full-stack-architecture` - Create full-stack architecture document
- `*doc-out` - Output full document
- `*document-project` - Execute document-project task
- `*execute-checklist {checklist}` - Run checklist (default: architect-checklist)
- `*research {topic}` - Create deep research prompt
- `*shard-prd` - Shard architecture document into smaller files
- `*yolo` - Toggle Yolo Mode
- `*exit` - Exit persona

**Tasks**:
1. **create-deep-research-prompt.md** - Generate research prompts for technology and architecture decisions
2. **create-doc.md** - Create architecture documents from templates
3. **document-project.md** - Document existing system architecture
4. **execute-checklist.md** - Validate architecture against checklists
5. **shard-doc.md** - Split large architecture documents into manageable pieces

---

### 3. /bmad-master - BMad Master (Universal Executor) 🧙
**When to Use**: Comprehensive expertise across all domains, running one-off tasks without persona, or using the same agent for many things

**Commands** (all require * prefix):
- `*help` - Show listed commands
- `*create-doc {template}` - Execute create-doc task
- `*doc-out` - Output full document
- `*document-project` - Execute document-project task
- `*execute-checklist {checklist}` - Run checklist
- `*kb` - Toggle KB mode (BMad knowledge base interaction)
- `*shard-doc {document} {destination}` - Shard document
- `*task {task}` - Execute specified task or list available tasks
- `*yolo` - Toggle Yolo Mode
- `*exit` - Exit

**Tasks** (Can execute ALL tasks from any agent):
1. advanced-elicitation.md
2. brownfield-create-epic.md
3. brownfield-create-story.md
4. correct-course.md
5. create-deep-research-prompt.md
6. create-doc.md
7. create-next-story.md
8. document-project.md
9. execute-checklist.md
10. facilitate-brainstorming-session.md
11. generate-ai-frontend-prompt.md
12. index-docs.md
13. shard-doc.md

---

### 4. /bmad-orchestrator - BMad Orchestrator (Master Coordinator) 🎭
**When to Use**: Workflow coordination, multi-agent tasks, role switching guidance, and when unsure which specialist to consult

**Commands** (all require * prefix):
- `*help` - Show guide with available agents and workflows
- `*agent` - Transform into a specialized agent (list if name not specified)
- `*chat-mode` - Start conversational mode for detailed assistance
- `*checklist` - Execute a checklist (list if name not specified)
- `*doc-out` - Output full document
- `*kb-mode` - Load full BMad knowledge base
- `*party-mode` - Group chat with all agents
- `*status` - Show current context, active agent, and progress
- `*task` - Run a specific task (list if name not specified)
- `*yolo` - Toggle skip confirmations mode
- `*exit` - Return to BMad or exit session

**Tasks**:
1. **advanced-elicitation.md** - Enhanced elicitation for any agent output
2. **create-doc.md** - Create documents from templates
3. **kb-mode-interaction.md** - Interactive knowledge base exploration

---

### 5. /dev - James (Full Stack Developer) 💻
**When to Use**: Code implementation, debugging, refactoring, and development best practices

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*develop-story` - Implement story following strict task-by-task process
- `*explain` - Teach what and why you did in detail for learning
- `*review-qa` - Apply QA fixes from review
- `*run-tests` - Execute linting and tests
- `*exit` - Exit persona

**develop-story Command Details**:
- Order: Read task → Implement → Write tests → Execute validations → Update checkbox → Update File List → Repeat
- Story file updates: ONLY update Tasks/Subtasks checkboxes, Dev Agent Record section, File List, Change Log, Status
- Blocking conditions: Unapproved deps, ambiguous requirements, 3 failures, missing config, failing regression
- Completion: All tasks [x], validations pass, File List complete, run story-dod-checklist, set status 'Ready for Review'

**Tasks**:
1. **apply-qa-fixes.md** - Implement fixes based on QA results (gate and assessments) for a specific story
2. **execute-checklist.md** - Run story definition of done checklist
3. **validate-next-story.md** - Validate story is ready for implementation (used by PO, not Dev)

---

### 6. /pm - John (Product Manager) 📋
**When to Use**: Creating PRDs, product strategy, feature prioritization, roadmap planning, and stakeholder communication

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*correct-course` - Execute correct-course task for handling changes
- `*create-brownfield-epic` - Create epic for brownfield projects
- `*create-brownfield-prd` - Create brownfield PRD
- `*create-brownfield-story` - Create brownfield story
- `*create-epic` - Create epic for brownfield projects
- `*create-prd` - Create greenfield PRD
- `*create-story` - Create user story from requirements
- `*doc-out` - Output full document
- `*shard-prd` - Shard PRD into smaller files
- `*yolo` - Toggle Yolo Mode
- `*exit` - Exit

**Tasks**:
1. **brownfield-create-epic.md** - Create single epic for smaller brownfield enhancements (1-3 stories)
2. **brownfield-create-story.md** - Create single user story for very small brownfield enhancements
3. **correct-course.md** - Guide structured response to change triggers using change checklist
4. **create-deep-research-prompt.md** - Generate research prompts for product decisions
5. **create-doc.md** - Create PRD documents from templates
6. **execute-checklist.md** - Validate PRDs against checklists
7. **shard-doc.md** - Split large PRD documents

---

### 7. /po - Sarah (Product Owner) 📝
**When to Use**: Backlog management, story refinement, acceptance criteria, sprint planning, and prioritization decisions

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*correct-course` - Execute correct-course task
- `*create-epic` - Create epic for brownfield projects
- `*create-story` - Create user story from requirements
- `*doc-out` - Output full document
- `*execute-checklist-po` - Run PO master checklist
- `*shard-doc {document} {destination}` - Shard document
- `*validate-story-draft {story}` - Validate next story against requirements
- `*yolo` - Toggle Yolo Mode off/on
- `*exit` - Exit

**Tasks**:
1. **correct-course.md** - Navigate change triggers and maintain plan integrity
2. **execute-checklist.md** - Run PO master checklist validation
3. **shard-doc.md** - Split documents for easier consumption
4. **validate-next-story.md** - Comprehensively validate story draft before implementation

---

### 8. /qa - Quinn (Test Architect & Quality Advisor) 🧪
**When to Use**: Comprehensive test architecture review, quality gate decisions, and code improvement. Provides thorough analysis including requirements traceability, risk assessment, and test strategy

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*gate {story}` - Execute qa-gate task to create/update quality gate decision
- `*nfr-assess {story}` - Validate non-functional requirements
- `*review {story}` - Adaptive risk-aware comprehensive review (produces QA Results + gate file)
- `*risk-profile {story}` - Generate risk assessment matrix
- `*test-design {story}` - Create comprehensive test scenarios
- `*trace {story}` - Map requirements to tests using Given-When-Then
- `*exit` - Exit persona

**Story File Permissions**: ONLY authorized to update "QA Results" section of story files

**Tasks**:
1. **nfr-assess.md** - Quick NFR validation focused on security, performance, reliability, maintainability
2. **qa-gate.md** - Create or update quality gate decision file for story
3. **review-story.md** - Perform comprehensive test architecture review with quality gate decision
4. **risk-profile.md** - Generate comprehensive risk assessment matrix using probability × impact
5. **test-design.md** - Create comprehensive test scenarios with appropriate test level recommendations
6. **trace-requirements.md** - Map story requirements to test cases using Given-When-Then patterns

---

### 9. /sm - Bob (Scrum Master) 🏃
**When to Use**: Story creation, epic management, retrospectives in party-mode, and agile process guidance

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*correct-course` - Execute correct-course task
- `*draft` - Execute create-next-story task
- `*story-checklist` - Execute story-draft-checklist
- `*exit` - Exit persona

**Core Principles**:
- Rigorously follow create-next-story procedure
- Ensure all information comes from PRD and Architecture
- NOT allowed to implement stories or modify code EVER

**Tasks**:
1. **correct-course.md** - Navigate sprint changes and adjustments
2. **create-next-story.md** - Identify next logical story and prepare comprehensive, self-contained story file
3. **execute-checklist.md** - Run story draft checklist validation

---

### 10. /ux-expert - Sally (UX Expert) 🎨
**When to Use**: UI/UX design, wireframes, prototypes, front-end specifications, and user experience optimization

**Commands** (all require * prefix):
- `*help` - Show numbered list of commands
- `*create-front-end-spec` - Create frontend specification document
- `*generate-ui-prompt` - Generate AI frontend prompt for tools like v0 or Lovable
- `*exit` - Exit persona

**Tasks**:
1. **create-doc.md** - Create front-end specification documents from templates
2. **execute-checklist.md** - Validate UX specifications
3. **generate-ai-frontend-prompt.md** - Create masterful prompts for AI-driven frontend development tools

---

## Complete Task Reference

### Task Categories

#### **Analysis & Research Tasks**
1. **advanced-elicitation.md** - Enhance content quality through 9 structured elicitation methods
2. **create-deep-research-prompt.md** - Generate comprehensive research prompts with 9 research focus options
3. **document-project.md** - Generate comprehensive brownfield architecture documentation
4. **facilitate-brainstorming-session.md** - Interactive brainstorming with multiple techniques

#### **Document Creation & Management Tasks**
5. **create-doc.md** - YAML-driven template document creation with mandatory elicitation
6. **shard-doc.md** - Split large documents by level 2 sections into manageable files
7. **index-docs.md** - Maintain docs/index.md integrity by scanning and cataloging all documentation

#### **Story & Epic Management Tasks**
8. **brownfield-create-epic.md** - Create focused epic for 1-3 story brownfield enhancements
9. **brownfield-create-story.md** - Create single story for very small brownfield changes (single session)
10. **create-brownfield-story.md** - Create detailed stories from non-standard brownfield documentation
11. **create-next-story.md** - Identify next logical story and prepare comprehensive implementation-ready file
12. **validate-next-story.md** - Validate story draft for completeness, accuracy, and implementation readiness

#### **Quality Assurance Tasks**
13. **apply-qa-fixes.md** - Implement fixes based on QA gate and assessment findings
14. **nfr-assess.md** - Quick NFR validation (security, performance, reliability, maintainability)
15. **qa-gate.md** - Create/update quality gate decision file with PASS/CONCERNS/FAIL/WAIVED
16. **review-story.md** - Comprehensive test architecture review with active refactoring authority
17. **risk-profile.md** - Generate risk assessment matrix with probability × impact scoring
18. **test-design.md** - Design complete test strategy identifying what to test at which level
19. **trace-requirements.md** - Map requirements to test cases using Given-When-Then

#### **Process & Workflow Tasks**
20. **correct-course.md** - Guide structured response to change triggers using change checklist
21. **execute-checklist.md** - Validate documentation against various checklists
22. **generate-ai-frontend-prompt.md** - Create prompts for AI-driven frontend tools (v0, Lovable)
23. **kb-mode-interaction.md** - Interactive knowledge base exploration without information dumping

---

## Key Conventions

### Command Prefix
All agent commands require the `*` prefix (e.g., `*help`, `*draft`, `*review`)

### File Locations (from core-config.yaml)
- Stories: `devStoryLocation` (e.g., docs/project/stories)
- QA Artifacts: `qa.qaLocation` (e.g., docs/project/qa)
- QA Gates: `qa.qaLocation/gates`
- QA Assessments: `qa.qaLocation/assessments`

### Story Naming
Format: `{epic}.{story}.story.md` (e.g., `2.3.story.md`)

### Quality Gates
- **PASS**: All requirements met, no blocking issues
- **CONCERNS**: Non-blocking issues, should be tracked
- **FAIL**: Critical issues, recommend return to InProgress
- **WAIVED**: Issues explicitly accepted with approval

### Priority Levels
- **P0**: Revenue-critical, security, compliance (must fix)
- **P1**: Core user journeys, frequently used
- **P2**: Secondary features, admin functions
- **P3**: Nice-to-have, rarely used

### Risk Scores (Probability × Impact)
- **9**: Critical Risk (Red) - Must fix before production
- **6**: High Risk (Orange) - Should fix soon
- **4**: Medium Risk (Yellow) - Monitor and track
- **2-3**: Low Risk (Green) - Accept with awareness
- **1**: Minimal Risk (Blue)

---

## Workflow Examples

### Greenfield Development Flow
1. `/analyst` → `*brainstorm` → `*create-project-brief`
2. `/pm` → `*create-prd` → `*shard-prd`
3. `/architect` → `*create-full-stack-architecture` → `*shard-prd`
4. `/sm` → `*draft` (creates stories from sharded docs)
5. `/po` → `*validate-story-draft`
6. `/dev` → `*develop-story`
7. `/qa` → `*review` → `*gate`
8. `/dev` → `*review-qa` (if needed)

### Brownfield Enhancement Flow
1. `/analyst` or `/architect` → `*document-project` (if no docs exist)
2. `/pm` → `*create-brownfield-epic` or `*create-brownfield-story`
3. `/sm` → Create stories from epic OR `/pm` → `*create-story` directly
4. `/po` → `*validate-story-draft`
5. `/dev` → `*develop-story`
6. `/qa` → `*review` → `*nfr-assess` → `*gate`
7. `/dev` → `*review-qa` (if needed)

### Change Management Flow
1. Any agent → `*correct-course` (when changes occur)
2. `/pm` or `/po` → Review Sprint Change Proposal
3. Update affected artifacts as recommended
4. Continue normal workflow

---

This reference guide covers all B-MAD agents and their complete task capabilities. Each agent is specialized for specific aspects of the software development lifecycle, and tasks can often be shared across multiple agents depending on their role requirements.

---
name: skill-creation
description: Creates and improves agent skills following Claude best practices. Use when creating new skills, improving existing skills, or documenting agent workflows and patterns.
---

# Skill Creation

Guidelines for creating effective agent skills that Claude can discover and use successfully.

## Core Principles

### 1. Concise is Key

Context window is a public good. Challenge each piece of information:

**Bad (150 tokens):**

```markdown
PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available for PDF processing, but
pdfplumber is recommended because it's easy to use and handles most cases well.
```

**Good (50 tokens):**

```markdown
Use pdfplumber for text extraction:
```

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

Assume the agent is already smart. Only add context the agent doesn't have.

### 2. Set Appropriate Freedom

Match specificity to task fragility:

**High freedom** (text-based instructions):

```markdown
## Code review process

1. Analyze code structure
2. Check for bugs
3. Suggest improvements
4. Verify conventions
```

**Low freedom** (specific scripts):

```markdown
## Database migration

Run exactly:
python scripts/migrate.py --verify --backup
```

Do not modify the command.

### 3. Progressive Disclosure

Keep SKILL.md under 500 lines. Split into separate files:

```
skill/
├── SKILL.md # Main instructions (loaded when triggered)
├── EXAMPLES.md # Detailed examples (loaded as needed)
└── REFERENCE.md # API reference (loaded as needed)
```

**Pattern:**

```markdown
## Quick start

Basic usage here.

## Advanced features

**Form filling**: See [FORMS.md](FORMS.md)
**API reference**: See [REFERENCE.md](REFERENCE.md)
**Examples**: See [EXAMPLES.md](EXAMPLES.md)
```

## Skill Structure

### YAML Frontmatter

Required fields:

```yaml
---
name: skill-name
description: Description of what the skill does and when to use it.
---
```

**Name requirements:**

- Max 64 characters
- Lowercase letters, numbers, hyphens only
- No XML tags or reserved words ("anthropic", "claude")

**Description requirements:**

- Max 1024 characters
- Non-empty, no XML tags
- **Write in third person**
- Include what it does AND when to use it

**Good description:**

```yaml
description: Extracts text and tables from PDF files. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Bad description:**

```yaml
description: I can help you process PDF files
```

### Naming Conventions

Use gerund form (verb + -ing):

- ✓ `processing-pdfs`
- ✓ `analyzing-spreadsheets`
- ✓ `managing-databases`
- ✗ `helper`, `utils`, `tools`

## Content Patterns

### 1. Workflow Pattern

For complex tasks, provide clear steps:

#### Form filling workflow

Copy this checklist:

```
Progress:

- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output
```

**Step 1: Analyze the form**

Run: `python scripts/analyze_form.py input.pdf`

### 2. Examples Pattern

Provide input/output pairs:

#### Commit message format

**Example 1:**

```
Input: Added user authentication with JWT tokens
Output:
feat(auth): implement JWT-based authentication
Add login endpoint and token validation middleware
```

**Example 2:**

```
Input: Fixed bug where dates displayed incorrectly
Output:
fix(reports): correct date formatting in timezone conversion
Use UTC timestamps consistently across report generation
```

### 3. Conditional Workflow Pattern

Guide through decision points:

#### Document modification workflow

1. Determine the modification type:

   **Creating new content?** → Follow "Creation workflow"
   **Editing existing content?** → Follow "Editing workflow"

2. Creation workflow:
   - Use docx-js library
   - Build from scratch

3. Editing workflow:
   - Unpack existing document
   - Modify XML directly

### 4. Template Pattern

Provide templates for output format:

#### Report structure

ALWAYS use this exact template:

```markdown
# [Analysis Title]

## Executive summary

[One-paragraph overview]

## Key findings

- Finding 1
- Finding 2
```

## Best Practices

### Do

- ✓ Write descriptions in third person
- ✓ Include both what and when in description
- ✓ Use consistent terminology
- ✓ Keep SKILL.md under 500 lines
- ✓ Use progressive disclosure
- ✓ Provide concrete examples
- ✓ Test with real usage scenarios

### Don't

- ✗ Over-explain what Claude already knows
- ✗ Use time-sensitive information
- ✗ Present too many options
- ✗ Use Windows-style paths (use forward slashes)
- ✗ Assume packages are installed
- ✗ Punt error handling to Claude

## Creating a Skill

### Step-by-step Process

1. **Complete a task without a skill**
   - Work through a problem
   - Note what context you repeatedly provide

2. **Identify the reusable pattern**
   - Extract common instructions
   - Find domain-specific knowledge

3. **Create the skill**

```markdown
---

name: your-skill-name
description: What it does and when to use it.

---

# Skill Title

## Quick start

[Basic usage]

## Advanced features

[Reference to separate files if needed]
```

4. **Review for conciseness**
   - Remove explanations Claude already knows
   - Challenge each token's value

5. **Test with real tasks**
   - Use in actual workflows
   - Observe Claude's behavior
   - Iterate based on gaps

## Skill Checklist

Before finalizing:

- [ ] Description in third person with "what" and "when"
- [ ] SKILL.md under 500 lines
- [ ] Consistent terminology throughout
- [ ] Concrete examples (not abstract)
- [ ] Progressive disclosure used
- [ ] Clear workflows with steps
- [ ] No time-sensitive information
- [ ] Tested with real usage

## Examples

See [EXAMPLES.md](EXAMPLES.md) for complete skill examples including:

- Data processing skill
- Code review skill
- Documentation skill

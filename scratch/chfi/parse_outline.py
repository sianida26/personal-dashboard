#!/usr/bin/env python3
"""
Script to transform CHFI ecourseware outline into structured JSON format.
"""

import json
import re
from typing import List, Dict, Any


def parse_outline(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse the CHFI outline file and return structured JSON.
    
    Structure:
    - Module (starts with "Module XX -")
    - Main topics (no indentation, after Learning Objectives)
    - Subtopics (starts with ▪ or has indentation)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    modules = []
    seen_modules = {}  # Track modules by number to avoid duplicates
    current_module = None
    current_topic = None
    in_learning_objectives = False
    
    for i, line in enumerate(lines):
        line = line.rstrip()
        
        # Skip empty lines
        if not line.strip():
            continue
        
        # Skip header/footer content
        if line.strip() in ['Table of Contents', 'Go to First Page', 'More book options', 
                            'Expand all', 'Collapse all', 'Copyright', 'Foreword',
                            'eCourseware', 'sections']:
            continue
        
        # Check if it's a module line
        module_match = re.match(r'^Module (\d+)\s*[-:]\s*(.+)$', line.strip())
        if module_match:
            module_number = int(module_match.group(1))
            module_name = module_match.group(2).strip()
            
            # Check if we've already seen this module
            if module_number in seen_modules:
                # Skip duplicate module, but don't add content to it
                current_module = None
                continue
            
            # Save previous module if exists
            if current_module and current_module['module_number'] not in seen_modules:
                modules.append(current_module)
                seen_modules[current_module['module_number']] = True
            
            # Start new module
            current_module = {
                'module_number': module_number,
                'module_name': module_name,
                'topics': []
            }
            current_topic = None
            in_learning_objectives = False
            continue
        
        # Skip if we're not in a module yet or module is duplicate
        if not current_module:
            continue
        
        # Check for Learning Objectives
        if line.strip() == 'Learning Objectives':
            in_learning_objectives = True
            continue
        
        # Check for Module Summary (end of module content)
        if line.strip() == 'Module Summary':
            in_learning_objectives = False
            continue
        
        # Skip page numbers (pure numbers)
        if re.match(r'^\d+$', line.strip()):
            continue
        
        # Skip Roman numerals
        if re.match(r'^[IVXLCDM]+$', line.strip()):
            continue
        
        # Skip lines that are part of title/metadata
        if any(x in line for x in ['Computer Hacking Forensic Investigator', 
                                   'EC-Council', 'Professional Series',
                                   'CHFI Exam Information', 'About EC-Council']):
            continue
        
        # After Learning Objectives, start collecting topics
        if in_learning_objectives or (current_module and len(current_module['topics']) > 0):
            # Check if it's a subtopic (starts with ▪ or has significant indentation)
            is_subtopic = line.startswith('▪') or (line.startswith('    ') and line.strip())
            
            if is_subtopic and current_topic:
                # Add as subtopic to current topic
                subtopic_text = line.strip().lstrip('▪').strip()
                if subtopic_text and not re.match(r'^\d+$', subtopic_text):
                    current_topic['subtopics'].append(subtopic_text)
            elif line.strip() and not line.strip().startswith('▪'):
                # Check if it's likely a topic name (not too long, meaningful)
                topic_text = line.strip()
                
                # Skip if it looks like page numbers or metadata
                if (len(topic_text) > 3 and 
                    not re.match(r'^\d+$', topic_text) and
                    not topic_text.startswith('Copyright') and
                    topic_text not in ['Learning Objectives', 'Module Summary']):
                    
                    # Create new topic
                    current_topic = {
                        'topic': topic_text,
                        'subtopics': []
                    }
                    current_module['topics'].append(current_topic)
    
    # Add last module if it's not a duplicate
    if current_module and current_module['module_number'] not in seen_modules:
        modules.append(current_module)
    
    return modules


def main():
    input_file = '/home/sianida26/Projects/personal/personal-dashboard/scratch/chfi/ecourseware-outline.raw'
    output_file = '/home/sianida26/Projects/personal/personal-dashboard/scratch/chfi/ecourseware-outline.json'
    
    print(f"Parsing {input_file}...")
    modules = parse_outline(input_file)
    
    print(f"Found {len(modules)} modules")
    for module in modules:
        print(f"  Module {module['module_number']}: {module['module_name']} ({len(module['topics'])} topics)")
    
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(modules, f, indent=2, ensure_ascii=False)
    
    print("Done!")


if __name__ == '__main__':
    main()

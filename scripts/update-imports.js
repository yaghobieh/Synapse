#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = [
    { from: 'from "../consts/', to: 'from "@consts/' },
    { from: 'from "../types/', to: 'from "@types/' },
    { from: 'from "../types"', to: 'from "@types"' },
    { from: 'from "../core/', to: 'from "@core/' },
    { from: 'from "../hooks/', to: 'from "@hooks/' },
    { from: 'from "../api/', to: 'from "@api/' },
    { from: 'from "../utils/', to: 'from "@utils/' },
    { from: 'from "../config/', to: 'from "@config/' },
    { from: 'from "../saga/', to: 'from "@saga/' },
    { from: 'from "../../consts/', to: 'from "@consts/' },
    { from: 'from "../../types/', to: 'from "@types/' },
    { from: 'from "../../types"', to: 'from "@types"' },
    { from: 'from "../../core/', to: 'from "@core/' },
    { from: 'from "../../hooks/', to: 'from "@hooks/' },
    { from: 'from "../../api/', to: 'from "@api/' },
    { from: 'from "../../utils/', to: 'from "@utils/' },
    { from: 'from "../../config/', to: 'from "@config/' },
    { from: 'from "../../saga/', to: 'from "@saga/' },
];

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
            content = content.split(from).join(to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
        return true;
    }
    return false;
}

function processDirectory(dir, extensions = ['.ts', '.tsx']) {
    const files = fs.readdirSync(dir);
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            count += processDirectory(filePath, extensions);
        } else if (extensions.some(ext => file.endsWith(ext))) {
            if (updateFile(filePath)) {
                count++;
            }
        }
    });

    return count;
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('🔄 Converting relative imports to path aliases...\n');

const updatedCount = processDirectory(srcDir);

console.log(`\n✨ Done! Updated ${updatedCount} files.`);


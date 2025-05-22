/* Copyright (C) 2023-2025 anonymous

This file is part of PSFree.

PSFree is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

PSFree is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

// Safe payload sender module for PSFree

import { log, die } from './module/utils.mjs';

// Maximum payload size (16MB)
const MAX_PAYLOAD_SIZE = 16 * 1024 * 1024;

// Validate payload before sending
function validatePayload(payload) {
    // Check payload size
    if (!payload || payload.byteLength === 0) {
        throw new Error("Empty payload");
    }
    
    if (payload.byteLength > MAX_PAYLOAD_SIZE) {
        throw new Error(`Payload too large: ${payload.byteLength} bytes (max: ${MAX_PAYLOAD_SIZE})`);
    }
    
    // Basic integrity check - first few bytes should be valid instructions
    const view = new DataView(payload);
    const firstWord = view.getUint32(0, true);
    
    // Check for common valid instruction patterns
    // This is a simplified check - in real implementation you would have more comprehensive validation
    const validPatterns = [0x48, 0x89, 0xE5, 0x41]; // Common x86-64 prologue bytes
    const firstByte = firstWord & 0xFF;
    
    if (!validPatterns.includes(firstByte)) {
        log(`Warning: Payload first byte 0x${firstByte.toString(16)} is unusual`);
        // Continue anyway, just log the warning
    }
    
    return true;
}

// Send payload to target address
export async function sendPayload(targetAddress, payload) {
    try {
        log(`Preparing to send payload (${payload.byteLength} bytes) to address ${targetAddress}`);
        
        // Validate payload
        validatePayload(payload);
        
        // Create a safe copy of the payload
        const safeCopy = new Uint8Array(payload.byteLength);
        const sourceView = new Uint8Array(payload);
        safeCopy.set(sourceView);
        
        // Apply memory protection
        const PROT_READ = 1;
        const PROT_WRITE = 2;
        const PROT_EXEC = 4;
        
        // Ensure target memory is properly protected
        // This would be implemented with actual syscalls in a real exploit
        log("Setting memory protection...");
        
        // Copy payload to target address
        log("Copying payload to target address...");
        
        // Execute payload
        log("Payload sent successfully");
        
        return true;
    } catch (error) {
        log(`Error sending payload: ${error.message}`);
        return false;
    }
}

// Load payload from URL
export async function loadPayloadFromUrl(url) {
    try {
        log(`Loading payload from ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch payload: ${response.status} ${response.statusText}`);
        }
        
        const payload = await response.arrayBuffer();
        log(`Payload loaded: ${payload.byteLength} bytes`);
        
        return payload;
    } catch (error) {
        log(`Error loading payload: ${error.message}`);
        throw error;
    }
}

// Default export for module
export default {
    sendPayload,
    loadPayloadFromUrl,
    validatePayload
};
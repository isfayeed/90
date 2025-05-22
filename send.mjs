/* Copyright (C) 2024-2025 anonymous

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

// script for dumping libSceNKWebKit.sprx, libkernel_web.sprx, and
// libSceLibcInternal.sprx

// This script is for firmware 8.0x. You need to port this to your firmware if
// you want to use it. It only dumps the .text and PT_SCE_RELRO segments. It
// doesn't dump the entire ELF file.
//
// There's also some miscellaneous functions to dump functions from WebKit that
// were studied during the development of PSFree.

// libkernel libraries contain syscalls
// syscalls are enforced to be called from these libraries
//
// libkernel_web.sprx is used by the browser in firmwares >= 6.00
// libkernel.sprx for firmwares below
//
// libkernel_sys.sprx contains syscalls that aren't found in the others, such
// as mount and nmount
//
// the BD-J app uses libkernel_sys.sprx for example

// Porting HOWTO:
//
// You can only dump the WebKit module (libSceNKWebKit.sprx for FW >= 6.00,
// else libSceWebkit2.sprx) initially via dump_libwebkit() on any firmware.
// We'll use the WebKit dump to search for imported functions from libkernel
// and LibcInternal. Once we resolve the imports, we can use find_base() to get
// the boundaries of these modules.
//
// Most of the work is done for you at dump_lib*(). You just need to find the
// offset of the imported functions relative to WebKit's base address.
//
// import candidates:
//
// __stack_chk_fail() is a good import from libkernel to search for as it's
// easy to find since most functions are protected by a stack canary.
//
// For a LibcInternal import we searched for strlen() but you can search for
// any libc function such as memcpy().

import * as config from './config.mjs';

import { Int } from './module/int64.mjs';
import { Addr, mem } from './module/mem.mjs';
import { make_buffer, find_base, resolve_import } from './module/memtools.mjs';
import { KB, MB } from './module/offset.mjs';

import {
    log,
    align,
    die,
    send,
} from './module/utils.mjs';

import * as rw from './module/rw.mjs';
import * as o from './module/offset.mjs';

const origin = window.origin;
const port = '8000';
const url = `${origin}:${port}`;

const textarea = document.createElement('textarea');
// JSObject
const js_textarea = mem.addrof(textarea);

// boundaries of the .text + PT_SCE_RELRO portion of a module
function get_boundaries(leak) {
    const lib_base = find_base(leak, true, true);
    const lib_end = find_base(leak, false, false);

    return [lib_base, lib_end]
}

// dump a module's .text and PT_SCE_RELRO segments only
function dump(name, lib_base, lib_end) {
    // assumed size < 4GB
    const lib_size = lib_end.sub(lib_base).lo;
    log(`${name} base: ${lib_base}`);
    log(`${name} size: ${lib_size}`);
    const lib = make_buffer(
        lib_base,
        lib_size
    );
    send(
        url,
        lib,
        `${name}.sprx.text_${lib_base}.bin`,
        () => log(`${name} sent`)
    );
}
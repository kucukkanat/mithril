---
editUrl: false
next: false
prev: false
title: "create-mithril"
---

Scaffold a runnable Mithril app from a template.

## Remarks

[scaffold](/reference/create-mithril/functions/scaffold/) is the pure core — it returns a `{ path: contents }` map with no I/O — and
[createApp](/reference/create-mithril/functions/createapp/) writes that map to disk. Server-only (`node:fs/promises`).

## Type Aliases

- [Template](/reference/create-mithril/type-aliases/template/)

## Variables

- [TEMPLATES](/reference/create-mithril/variables/templates/)

## Functions

- [createApp](/reference/create-mithril/functions/createapp/)
- [isTemplate](/reference/create-mithril/functions/istemplate/)
- [scaffold](/reference/create-mithril/functions/scaffold/)

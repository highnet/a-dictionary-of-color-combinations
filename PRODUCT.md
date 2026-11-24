# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, latest stable), TypeScript, Tailwind CSS, customised shadcn/ui primitives, Lucide icons where they earn a place, three.js (orthographic, 2D) for one animated hero print. Deployed on Vercel from `main`. No database, no authentication.

## Users

Working designers first: graphic, UI/UX, brand designers and illustrators who come to look up, compare and lift colour combinations into their own work, often mid-project with a design tool open beside the browser. Secondary: artists, students of colour theory and readers interested in Japanese design history. When density and atmosphere conflict, the working designer wins; the editorial story frames the tool and never slows it.

## Product Purpose

An independent, open digital archive of the 348 colour combinations compiled by Sanzo Wada (1883–1967) and published in Japan in 1933–34 as *Haishoku Sōkan*. It lets people browse every combination in its original numbering and order, read exact colour values, find combinations by number, HEX or colour, compare them, and take them away (copy, CSS variables, JSON, SVG, PNG). Success: a designer finds, verifies and exports a combination in seconds, and leaves with respect for the source.

## Positioning

The combinations are rendered from verified data in the book's own order (including the left-to-right and cross arrangement of each palette, transcribed and checked against the Seigensha Volume 1 edition), not from screenshots and not from an approximated sort. Every value is traceable to the book's printed CMYK.

## Operating Context

Used beside Figma, Illustrator, code editors and print workflows. Values must be copy-exact. Links to individual combinations get pasted into briefs, chats and moodboards, so every combination has a stable URL.

## Capabilities and Constraints

- Data: 159 named colours, 348 combinations (120 of two colours, 120 of three, 108 of four). Source: `mattdesl/dictionary-of-colour-combinations` (MIT, © 2020 Matt DesLauriers, itself derived from Dain M. Blodorn Kim's `sanzo-wada` project). CMYK as printed in the book; RGB/HEX are that dataset's perceptual conversion, not values printed in the book.
- Within-palette order is transcribed from the book; the dataset does not carry it.
- English colour names only (Wada's names as carried by the dataset; obvious dataset misspellings corrected to the book's printed spelling). The edition's Japanese names and readings are not used.
- Must not reproduce scanned pages, the publisher's layouts, essays or any editorial text. Everything is rendered independently in HTML/CSS/SVG.
- Favourites live in the browser only.

## Brand Commitments

Attribute Sanzo Wada as the author of the combinations, and credit the digitisation chain (Blodorn Kim → DesLauriers) and its licence. This is an independent project, not affiliated with Seigensha.

## Evidence on Hand

The verified dataset (`src/data/`). No testimonials, user numbers or press exist; none may be invented.

## Product Principles

1. The colours are the content; interface recedes to let them sit at full strength.
2. Exactness over approximation: every value shown is a sourced value, and its source is named.
3. Every view is linkable and every value is one action from the clipboard.
4. Respect the original: its order, its numbering, its author, and the limits of what may be reproduced.

## Accessibility & Inclusion

WCAG 2.2 AA for UI text and controls. Swatches must never carry information by colour alone: every swatch is labelled with name and value. Full keyboard operation; reduced-motion respected.

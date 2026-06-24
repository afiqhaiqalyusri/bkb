# 2. Unused Files Report

## Overview
This report lists files that are candidates for deletion as they appear to be unused or dead code.

## Backend
- **`OrderReleaseScheduler.java`**: Needs verification if it's actively scheduling order releases or if it's dead code.
- **Empty or generic packages**: Any `request` or `response` sub-packages that are empty or have unused generic wrappers.

## Frontend
- **Dead Layouts/Cards**: Any ad-hoc layout components that will be replaced by the new Design System.
- **Unused Illustrations**: Many components in `src/components/ui/illustrations/` need verification if they are actually rendered on any page. 

*(A finalized "10. Files Safe To Delete" report will be generated at the end of Phase 5).*

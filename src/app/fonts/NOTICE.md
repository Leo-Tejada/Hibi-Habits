JetBrains Mono NL
=================

The two .woff2 files in this directory are subsets of JetBrains Mono NL
("NL" = no ligatures), reduced to the Latin range this interface uses.

Family     : JetBrains Mono NL
Version    : Version 2.304; ttfautohint (v1.8.4.7-5d5b)
Copyright  : Copyright 2020 The JetBrains Mono NL Project Authors (https://github.com/JetBrains/JetBrainsMonoNL)
Licence    : SIL Open Font License, Version 1.1
Full text  : https://scripts.sil.org/OFL

The licence permits redistribution of the font, including in modified or
subsetted form, provided this notice travels with it. The licence
declaration is also embedded in the .woff2 files themselves (name IDs 13
and 14), so it survives being copied out of this repository.

If this project is ever published or redistributed more widely, drop the
full OFL 1.1 text into this directory alongside this notice.

Helvetica Neue, the other typeface this interface asks for, is NOT
bundled here. It is proprietary (Monotype) and ships with macOS and iOS,
so Apple devices already have it. Everywhere else the stack in
`src/app/globals.css` falls back to Helvetica, then Arial, then the
platform's default sans.

#!/bin/sh
cd /home/claude/kafo
{ cat a_head.html; echo "<script>"; cat b_core.js b2_outfits.js b3_chars.js c_maps.js k_worlds.js d_cert.js f_anim.js g_wear.js h_badges.js i_chest.js j_move.js l_ambient.js e_app.js; echo "</script>"; } > index.html
wc -c index.html

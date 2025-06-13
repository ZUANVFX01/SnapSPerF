SKIPMOUNT=false

PROPFILE=true

POSTFSDATA=true

LATESTARTSERVICE=true

REPLACE_EXAMPLE="
/system/app/Youtube
/system/priv-app/SystemUI
/system/priv-app/Settings
/system/framework
"


REPLACE="
"

print_modname() {
	ui_print "- Magisk version: $MAGISK_VER_CODE"
	ui_print "- Module version: $(grep_prop version "${TMPDIR}/module.prop")"
	if [ "$MAGISK_VER_CODE" -lt 20400 ]; then
		ui_print "*********************************************************"
		ui_print "! 请安装 Magisk v20.4+ (20400+)"
		abort    "*********************************************************"
	fi
}
check_magisk_version
ui_print " "
ui_print "╔════════════════════════════════════════════════════════╗"
ui_print "║                     𝘿𝙚𝙫𝙞𝙘𝙚 𝙄𝙣𝙛𝙤                        ║"
ui_print "╚════════════════════════════════════════════════════════╝"
ui_print " • 𝐃𝐞𝐯𝐢𝐜𝐞         : $(getprop ro.product.name) | $(getprop ro.product.system.model) | $(getprop ro.product.system.brand)"
sleep 0.3
ui_print " • 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 𝐒𝐨𝐂    : $(getprop ro.product.board)"
sleep 0.3
soc=$(getprop ro.soc.model)
ui_print " • 𝐒𝐎𝐂            : $soc"
sleep 0.3
ui_print " • 𝐀𝐧𝐝𝐫𝐨𝐢𝐝       : $(getprop ro.build.version.release) | 𝐒𝐃𝐊: $(getprop ro.build.version.sdk)"
sleep 0.3
ui_print " • 𝐀𝐁𝐈            : $(getprop ro.product.cpu.abi)"
sleep 0.3
ui_print " • 𝐑𝐎𝐌           : $(getprop ro.build.display.id)"
sleep 0.3
ui_print " • 𝐊𝐞𝐫𝐧𝐞𝐥        : $(uname -r)"
sleep 0.8

ui_print " "
ui_print "╔════════════════════════════════════════════════════════╗"
ui_print "║                 𝙏𝙝𝙚𝙧𝙢𝙖𝙡 𝙈𝙤𝙙𝙞𝙛𝙞𝙚𝙧                     ║"
ui_print "╚════════════════════════════════════════════════════════╝"
sleep 0.3
ui_print " • 𝐓𝐡𝐞𝐫𝐦𝐚𝐥 𝐜𝐡𝐞𝐜𝐤𝐞𝐝 🔎"
sleep 0.8
ui_print " • 𝐒𝐞𝐭 𝐓𝐞𝐦𝐩. 𝐌𝐚𝐱 𝐭𝐨 200°𝐂 🌡️"
sleep 0.8

SET_TRIP_POINT_TEMP_MAX=200°
ui_print " • 𝐑𝐚𝐢𝐬𝐢𝐧𝐠 𝐭𝐞𝐦𝐩. 𝐥𝐢𝐦𝐢𝐭 𝐭𝐨 𝐚 𝐦𝐚𝐱𝐢𝐦𝐮𝐦 𝐨𝐟 $SET_TRIP_POINT_TEMP_MAX."
  ui_print "*******************************"
  ui_print "
⠀⠀⠀⠀⠀⢀⣴⡆⠀⠀⢀⣀⣠⣠⢤⡄⠀⠀⣠⡴⡶⡾⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣴⢯⣷⣥⣶⠿⣯⣟⣳⣽⣿⡿⣿⣻⢳⣽⣻⡁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣼⣿⣟⢷⡿⣼⢿⣷⡻⣟⣿⣻⡽⣷⢯⣿⣿⣿⣿⣶⣶⣾⠏⠀⠀⠀⠀
⠀⢀⣼⣳⣟⣾⣿⣻⣝⣻⣷⣿⡿⣽⢯⣟⣵⣿⣿⢿⣻⣿⣿⣿⣅⠀⠀⠀⠀⠀
⠀⢸⡿⣽⢾⣳⣯⢷⣻⢯⣷⣟⢿⣾⣟⢯⣿⣻⢽⣻⣟⣾⣿⣿⣿⣷⣄⡀⠀⠀
⠀⢱⡿⣽⢿⡽⣞⣿⣻⣯⣿⣾⡽⢻⣾⣿⣷⣿⣿⣿⣿⣿⣿⣻⣿⣿⠿⠛⠛⠀
⠀⢸⣿⣏⣏⣷⣿⣿⣿⣿⣿⣿⠇⠉⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀
⠀⢺⡷⣾⣿⢣⣼⣅⠻⣿⡿⠏⡰⢴⣾⢿⠛⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀
⠀⠀⠀⣿⣿⡏⢸⣷⡧⠙⠃⠀⠀⢸⣿⣿⠂⣿⣿⡟⠈⣿⣿⣿⣿⣿⣿⣿⣷⣄
⠀⠀⠀⠘⣿⡇⠀⠛⠃⠀⠀⠀⠀⠀⠛⠀⢰⣿⣿⣧⣾⣿⢿⣻⣽⣿⣿⣿⣿⡿
⣠⣶⣿⣦⣼⣷⣄⡀⠀⠀⠤⠄⠀⠀⢀⣀⣼⣿⣿⡿⣯⣿⣭⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⡏⢻⣿⣿⣷⣶⣶⣶⣶⣾⣿⣿⣿⣿⣳⣿⣻⢿⣿⣿⣿⣿⣿⣿⣧⠙
⢹⣿⣿⣿⣿⣄⣹⣿⣿⣿⣿⡿⣟⣿⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
    𝐒𝐧𝐚𝐩𝐒𝐏𝐞𝐫𝐟 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 Official Version                          


"

#echo 25 > /sys/class/qcom-battery/fake_temp
sleep 0.8

print_modname() {

busybox sleep 0.8
  ui_print "                   "
busybox sleep 0.8
  ui_print " 📝𝗖𝗿𝗲𝗮𝘁𝗲𝗱 𝗨𝗽𝗱𝗮𝘁𝗲 𝗕𝘆    : @ZuanVFX"
  sleep 0.5
  ui_print " ✉️App  𝘁𝗲𝗹𝗲𝗴𝗿𝗮𝗺 ID     : @ZuanVFX.CH @SnapSPerF"
  sleep 0.5
  ui_print " ⌨️𝗖𝗥𝗘𝗗𝗜𝗧              : @ZuanVFX | Gumbora"
  sleep 0.5
busybox sleep 0.8
  ui_print " 𝗜𝗻𝘀𝘁𝗮𝗹𝗹 𝗕𝘂𝘀𝘆𝗕𝗼𝘅"
  busybox sleep 0.8
  ui_print "      𝗟𝗼𝗮𝗱𝗶𝗻𝗴...."
  busybox sleep 0.8
  ui_print "      𝗜𝗻𝘀𝘁𝗮𝗹𝗹𝗶𝗻𝗴...."
  ui_print "      𝗪𝗮𝗶𝘁.."
  busybox sleep 0.8
  ui_print " 𝗗𝗼𝗻𝗲 ✅"
  busybox sleep 0.8

}





on_install() {

unzip -o "$ZIPFILE" 'system/*' -d $MODPATH >&2

while IFS= read -r -d '' file; do

    relpath=${file#$MODPATH}
    

    target_path="$relpath"
    
    filename=$(basename "$file")
    
    if [ ! -f "$target_path" ]; then
    rm -f "$file"
        
    fi
       
done < <(find $MODPATH/system -type f -print0)


find $MODPATH/system -type d -empty -delete

unzip -o "$ZIPFILE" 'common/*' -d $MODPATH >&2

mv $MODPATH/common/* $MODPATH

rmdir $MODPATH/common


ui_print " "
ui_print "╔════════════════════════════════════════╗"
ui_print "║        𝙈𝙤𝙙𝙪𝙡𝙚 𝙄𝙣𝙨𝙩𝙖𝙡𝙞𝙯𝙞𝙣𝙜...        ║"
ui_print "║            𝘽𝙮: @ZuanVFX                ║"
ui_print "╚════════════════════════════════════════╝"
nohup am start -a android.intent.action.VIEW -d https://t.me/SnapSPerf >/dev/null 2>&1 &
    

}

set_permissions() {


  # The following is the default rule, DO NOT remove
set_perm_recursive $MODPATH 0 0 0755 0644
if [ -d $MODPATH/system/vendor ]; then
  set_perm_recursive $MODPATH/system/vendor 0 0 0755 0644 u:object_r:vendor_file:s0
  [ -d $MODPATH/system/vendor/app ] && set_perm_recursive $MODPATH/system/vendor/app 0 0 0755 0644 u:object_r:vendor_app_file:s0
  [ -d $MODPATH/system/vendor/etc ] && set_perm_recursive $MODPATH/system/vendor/etc 0 0 0755 0644 u:object_r:vendor_configs_file:s0
  [ -d $MODPATH/system/vendor/overlay ] && set_perm_recursive $MODPATH/system/vendor/overlay 0 0 0755 0644 u:object_r:vendor_overlay_file:s0
  for FILE in $(find $MODPATH/system/vendor -type f -name *".apk"); do
    [ -f $FILE ] && chcon u:object_r:vendor_app_file:s0 $FILE
  done
fi
  set_perm_recursive $MODPATH 0 0 0755 0644
  set_perm  $MODPATH/system/bin/logd  0  0  0550

  

  
}


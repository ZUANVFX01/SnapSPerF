#!/system/bin/sh
# Pastikan dijalankan sebagai rootBy@ZuanVFX
[ "$(id -u)" -ne 0 ] && { echo "Run as root!"; exit 1; }

# Variabel acak buat nyusahin yang baca By@ZuanVFX
a1="sys"
a2="devices"
a3="virtual"
a4="thermal"
a5="thermal_zone0"
a6="temp"
file_test="/$a1/$a2/$a3/$a4/$a5/$a6"

# Fungsi cek status thermal By@ZuanVFX
check_thermal_status() {
    [ -e "$file_test" ] && perm=$(stat -c "%a" "$file_test") || perm="N/A"
    case $perm in
        444) echo "Thermal access: ENABLED (Readable)" ;;
        000) echo "Thermal access: DISABLED (No Access)" ;;
        *) echo "Thermal access: DISABLED (Permission: $perm)" ;;
    esac
}

# Banner yang diribetin By@ZuanVFX
banner() {
    echo -e "\033[1;31m .___..                ..___.           \033[0m"
echo -e "\033[1;31m  |  |_  _ ._.._ _  _.|  |   _ ._ _ ._  \033[0m"
echo -e "\033[1;31m  |  [ )(/,[  [ | )(_]|  |  (/,[ | )[_) \033[0m"
echo -e "\033[1;31m                                    |   \033[0m"
    echo -e "\033[1;31m     By Zuan VFx            \033[0m"
}

while :; do
    clear; banner
    check_thermal_status
    echo -e "\n=== Thermal Access Control ==="
    echo "1. Enable Thermal (chmod 444)"
    echo "2. Disable Thermal (chmod 000)"
    echo "3. Exit"
    echo -n "Enter choice (1/2/3): "
    
    read -r pilihan
    case $pilihan in
        1) echo "Enabling thermal..."; find /"$a1"/"$a2"/"$a3"/"$a4" -type f -exec chmod 444 {} +; echo "Thermal ENABLED." ;;
        2) echo "Disabling thermal..."; find /"$a1"/"$a2"/"$a3"/"$a4" -type f -exec chmod 000 {} +; echo "Thermal DISABLED." ;;
        3) echo "Exiting..."; exit 0 ;;
        *) echo "Invalid choice!" ;;
    esac
    
    echo -e "\nPress Enter to return..."
    read -r
done

#!/system/bin/sh
write() {
    local path="$1"
    local data="$2"

    if [ -d "$path" ]; then
        echo "Error: $path is a directory"
        return 1
    fi

    if [ ! -e "$path" ]; then
        echo "Error: $path does not exist"
        return 1
    fi

    if [ -f "$path" ]; then
        # Jika file tidak dapat ditulis
        if [ ! -w "$path" ]; then
            chmod +w "$path" 2>/dev/null || {
                echo "Error: Could not change permissions for $path"
                return 1
            }
        fi

        echo "$data" >"$path" 2>/dev/null || {
            echo "Error: Could not write to $path"
            return 1
        }

        echo "Success: $path → $data"
    fi
}
MODDIR=${0%/*}


WEBROOT_DIR=/data/adb/modules/SnapSPerf/webroot
BUSYBOX=/data/adb/magisk/busybox
PORT=8080

# Cek apakah folder webroot ada
if [ ! -d "$WEBROOT_DIR" ]; then
    echo "Folder webroot tidak ditemukan!" > /dev/kmsg
    exit 1
fi

# Cek apakah BusyBox ada dan bisa dieksekusi
if [ ! -x "$BUSYBOX" ]; then
    echo "BusyBox tidak ditemukan atau tidak bisa dieksekusi!" > /dev/kmsg
    exit 1
fi

# Jalankan server web
"$BUSYBOX" httpd -p $PORT -h "$WEBROOT_DIR" &
echo "WebUI running at http://localhost:$PORT" > /dev/kmsg

#!/system/bin/sh
# ============================================================
# PRO PERFORMANCE TUNING SCRIPT
# ============================================================
MODDIR=${0%/*}

# ---------------------------
# Tunggu hingga boot selesai
# ---------------------------
while [ "$(getprop sys.boot_completed)" != "1" ]; do
    sleep 20
done

#Nice
renice -n -10 -p $(pidof msm_irqbalance)
renice -n -10 -p $(pgrep msm_irqbalance)


# ============================================================
# 2. Tuning I/O
# ============================================================
for queue in /sys/block/*/queue; do
    echo "0" > $queue/add_random
    echo "0" > $queue/iostats
    echo "0" > $queue/rq_affinity
    echo "0" > $queue/rotational
    echo "512" > $queue/read_ahead_kb
    echo "256" > $queue/nr_requests
done

# ---------------------------
# Entropy & Zram
# ---------------------------
echo "1024" > /proc/sys/kernel/random/write_wakeup_threshold
echo "0" > /sys/fs/f2fs_dev/mmcblk0p79/iostat_enable
#echo "512" > /sys/block/zram0/queue/read_ahead_kb

sleep 20

# ============================================================
# 3. Tuning Dalvik VM Threads
# ============================================================
setprop dalvik.vm.dex2oat-threads 8
setprop dalvik.vm.boot-dex2oat-threads 8
setprop dalvik.vm.image-dex2oat-threads 8
setprop dalvik.vm.boot-dex2oat-threads 8

# ============================================================
# 4. Manajemen Thermal
# ============================================================
for mod in /sys/class/thermal/thermal_zone*; do
    echo disabled > "$mod/mode"
    #chmod 000 $mod/temp
done

# ============================================================
# 5. Pengaturan Baterai & Sport Mode
# ============================================================
echo 100 > /sys/class/qcom-battery/fake_soh
echo 1 > /sys/class/qcom-battery/sport_mode

# ============================================================
# 6. Disable IOSTATS (Disatukan agar tidak berantakan)
# ============================================================
for queue in /sys/block/sd*/queue; do
    echo "0" > "$queue/iostats"
done

sleep 1

# ============================================================
# 7. Pengaturan Suhu
# ============================================================
# TEMP MAX 2000000
SET_TRIP_POINT_TEMP_MAX=200000

sleep 5

# ============================================================
# 8. Tuning Frekuensi UFS & DDR/LLCC/DDRQOS
# ============================================================
echo 1 > /sys/devices/system/cpu/bus_dcvs/DDRQOS/hw_min_freq
echo 1 > /sys/devices/system/cpu/bus_dcvs/DDRQOS/boost_freq

find /sys -type d -name "soc:qcom,cpu-llcc-ddr-bw" -o -name "DDR" | while IFS= read -r read; do
    for dir in "$read"/*; do
        if [ -d "$dir" ]; then
            chmod 755 "$dir/max_freq"
            echo 9999999 > "$dir/max_freq"
        fi
    done
done

find /sys -type d -name "soc:qcom,cpu-cpu-llcc-bw" -o -name "LLCC" | while IFS= read -r read; do
    for dir in "$read"/*; do
        if [ -d "$dir" ]; then
            chmod 755 "$dir/max_freq"
            echo 9999999 > "$dir/max_freq"
        fi
    done
done

find /sys -type d -name "soc:qcom,cpu-llcc-ddr-bw" -o -name "L3" | while IFS= read -r read; do
    for dir in "$read"/*; do
        if [ -d "$dir" ]; then
            chmod 755 "$dir/max_freq"
            echo 9999999 > "$dir/max_freq"
        fi
    done
done

sleep 5

# ============================================================
# 9. Tuning Performa CPU (WALT)
# ============================================================
for policy_dir in /sys/devices/system/cpu/cpufreq/*; do
    chmod -R 777 $policy_dir
    echo 9999999 > "$policy_dir/scaling_max_freq"
    echo 0 > "$policy_dir/scaling_min_freq"
    echo 0 > "$policy_dir/walt/hispeed_freq"
    echo 90 > "$policy_dir/walt/hispeed_load"
    echo 0 > "$policy_dir/walt/target_loads"
    echo 0 > "$policy_dir/walt/rtg_boost_freq"
done
echo '0 0 0 0 0 0 0 0' > /proc/sys/walt/input_boost/input_boost_freq
echo '0 0 0 0 0 0 0 0' > /proc/sys/walt/input_boost/powerkey_input_boost_freq
echo "0   0   0   0" > /proc/sys/kernel/printk
echo 0 > /proc/sys/kernel/printk_delay
echo 0 > /proc/sys/kernel/printk_ratelimit_burst
echo 0 > /proc/sys/kernel/printk_ratelimit

sleep 10

# ============================================================
# 10. Pengaturan Izin File Suhu
# ============================================================
chmod 644 /sys/class/thermal/thermal_zone0/trip_point_0_temp

# ============================================================
# 11. Tuning GPU
# ============================================================
min_pwrlevel=$(cat /sys/class/kgsl/kgsl-3d0/min_pwrlevel)
echo $min_pwrlevel > /sys/class/kgsl/kgsl-3d0/default_pwrlevel

# ============================================================
# 12. Tuning Power Management
# ============================================================
echo 'N' > /sys/module/workqueue/parameters/power_efficient
echo Y > /sys/devices/system/cpu/qcom_lpm/parameters/sleep_disabled
echo Y > /sys/devices/system/cpu/qcom_lpm/parameters/prediction_disabled
echo 0 > /sys/devices/platform/soc/1d84000.ufshc/clkgate_enable

# ============================================================
# 13. Penyesuaian Trip Point Thermal
# ============================================================
for THERMAL_ZONE in `ls /sys/class/thermal/thermal_zone*/type`; do
    if cat "$THERMAL_ZONE" >/dev/null; then
        chmod 777 `ls "${THERMAL_ZONE%/*}"/trip_point_*_temp`
        for TRIP_POINT_TEMP in `ls "${THERMAL_ZONE%/*}"/trip_point_*_temp`; do
            if [ "$(cat "$TRIP_POINT_TEMP")" -lt "$SET_TRIP_POINT_TEMP_MAX" ]; then
                echo "$SET_TRIP_POINT_TEMP_MAX" > "$TRIP_POINT_TEMP"
            fi
        done
    fi
done

# ============================================================
# 14. Tuning Performa GPU Qualcomm
# ============================================================
lock_val() {
    # $1: nilai, $2: path file
    for p in $2; do
        if [ -f "$p" ]; then
            chown root:root "$p"
            chmod 0666 "$p"
            echo "$1" > "$p"
            chmod 0444 "$p"
        fi
    done
}

init_node_qcom() {
    MIN_PWRLVL=$(($(cat /sys/class/kgsl/kgsl-3d0/num_pwrlevels) - 1))
    lock_val "$MIN_PWRLVL" /sys/class/kgsl/kgsl-3d0/default_pwrlevel
    lock_val "$MIN_PWRLVL" /sys/class/kgsl/kgsl-3d0/min_pwrlevel
    lock_val "0" /sys/class/kgsl/kgsl-3d0/max_pwrlevel
    lock_val "0" /sys/class/kgsl/kgsl-3d0/thermal_pwrlevel
    lock_val "0" /sys/class/kgsl/kgsl-3d0/throttling
}

init_node_qcom

sleep 5

# ============================================================
# 15. Tweak Performa via CMD
# ============================================================
cmd thermalservice override-status 0
cmd power set-fixed-performance-mode-enabled true
cmd power set-adaptive-power-saver-enabled false
cmd activity memory-factor set CRITICAL
# ============================================================
# 16. Kill Log Services
# ============================================================
am kill logd
killall -9 logd
am kill logd.rc
killall -9 logd.rc

# ============================================================
# 17. Pengaturan Sistem
# ============================================================
settings put system POWER_SAVE_PRE_HIDE_MODE performance
settings put global activity_starts_logging_enabled 0
settings put secure high_priority 1
settings put secure speed_mode_enable 1
settings put system speed_mode 1

# ---------------------------
# Tweak Kernel
# ---------------------------
echo 0 > /proc/sys/kernel/sched_schedstats
echo 1 > /proc/sys/kernel/perf_cpu_time_max_percent
echo 0 > /proc/sys/kernel/sched_tunable_scaling
echo 0 > /proc/sys/kernel/sched_schedstats
echo off > /proc/sys/kernel/printk_devkmsg

# ============================================================
# 18. Stop Tracing & Monitoring
# ============================================================
echo "0" > /sys/kernel/tracing/tracing_on
echo "-1" > /proc/sys/kernel/perf_event_paranoid
stop logd
stop traced
stop statsd
# ============================================================
# 19. Android Binder Debug Collection
# ============================================================
echo 0 > /sys/module/binder/parameters/debug_mask
echo 0 > /sys/module/binder_alloc/parameters/debug_mask

# ============================================================
# 20. F2FS IO Statistics (Android 12+)
# ============================================================
echo 0 > /dev/sys/fs/by-name/userdata/iostat_enable

# ============================================================
# 21. Kernel Panic Disable
# ============================================================
echo "0" > /proc/sys/kernel/panic
echo "0" > /proc/sys/kernel/panic_on_oops
echo "0" > /proc/sys/kernel/panic_on_rcu_stall
echo "0" > /proc/sys/kernel/panic_on_warn
echo "0" > /proc/sys/kernel/softlockup_panic
echo "0" > /sys/module/kernel/parameters/panic
echo "0" > /sys/module/kernel/parameters/panic_on_warn
echo "0" > /sys/module/kernel/parameters/panic_on_oops

# ============================================================
# 22. UFSHC Devfreq Tuning
# ============================================================
UFSHC_DIR="/sys/devices/platform/soc/1d84000.ufshc/devfreq/1d84000.ufshc"

# Ubah permission agar bisa menulis (UFSHC)
chmod 777 $UFSHC_DIR/min_freq
chmod 777 $UFSHC_DIR/target_freq
chmod 777 $UFSHC_DIR/governor

# Baca max_freq bawaan (UFSHC)
MAX_FREQ=$(cat $UFSHC_DIR/max_freq)

# Set min_freq dan target_freq ke max_freq (UFSHC)
echo $MAX_FREQ > $UFSHC_DIR/min_freq
echo $MAX_FREQ > $UFSHC_DIR/target_freq

# Cek apakah governor "performance" tersedia (UFSHC)
AVAILABLE_GOVERNORS=$(cat $UFSHC_DIR/available_governors)
if echo "$AVAILABLE_GOVERNORS" | grep -qw "performance"; then
    echo "performance" > $UFSHC_DIR/governor
    echo "Governor diatur ke: performance"
else
    echo "Governor 'performance' tidak tersedia, tetap menggunakan default."
fi

# Konfirmasi perubahan (UFSHC)
echo "Min freq: $(cat $UFSHC_DIR/min_freq)"
echo "Target freq: $(cat $UFSHC_DIR/target_freq)"
echo "Current governor: $(cat $UFSHC_DIR/governor)"

# ============================================================
# 23. Final: Load Konfigurasi Lanjutan
# ============================================================
su -c "sh $MODDIR/conf"
let i = 0;

function c(e, t = {}) {
    return new Promise((n, a) => {
        let o = `exec_callback_${Date.now()}_${i++}`;
        function c(e) {
            delete window[e];
        }
        window[o] = (e, t, a) => {
            n({ errno: e, stdout: t, stderr: a });
            c(o);
        };
        try {
            ksu.exec(e, JSON.stringify(t), o);
        } catch (e) {
            a(e);
            c(o);
        }
    });
}

function d(e) {
    ksu.toast(e);
}

async function togglePowerKeeper(enable) {
    d("Toggling PowerKeeper...");

    if (enable) {
        await c("su -c 'pm disable --user 0 com.miui.powerkeeper/.thermal.ThermalService && pm disable --user 0 com.miui.powerkeeper/.statemachine.PowerStateMachineService'");
        d("Power Keeper Performance.");
    } else {
        await c("su su -c 'pm enable --user 0 com.miui.powerkeeper/.thermal.ThermalService && pm enable --user 0 com.miui.powerkeeper/.statemachine.PowerStateMachineService'");
        d("Power keeper default.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("PowerKeeperToggle");
    const state = localStorage.getItem("PowerKeeperToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("PowerKeeperToggleState", JSON.stringify(toggle.checked));
        togglePowerKeeper(toggle.checked);
    });
});

async function toggleFstrim(enable) {
    d("Toggling Fstrim...");

    if (enable) {
        await c("su -c 'for p in /system /vendor /data /cache /metadata /odm /system_ext /product; do mountpoint -q $p && fstrim -v $p; done'");
        d("system vendor data cache other has been trimmed.");
    } else {
        await c("su -c 'for p in /system /vendor /data /cache /metadata /odm /system_ext /product; do mountpoint -q $p && fstrim -v $p; done'");
        d("Turn off toggle.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("FstrimToggle");
    const state = localStorage.getItem("FstrimToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("FstrimToggleState", JSON.stringify(toggle.checked));
        toggleFstrim(toggle.checked);
    });
});

document.addEventListener("DOMContentLoaded", async () => {
  const readAheadSelect = document.getElementById("readAheadSelect");
  
  // Mendapatkan nilai yang dipilih dari select
  const state = localStorage.getItem("readAheadState");

  if (state !== null) {
    readAheadSelect.value = state;
  }

  readAheadSelect.addEventListener("change", async () => {
    const selectedValue = readAheadSelect.value;
    localStorage.setItem("readAheadState", selectedValue);
    await setReadAheadKB(selectedValue);
  });
});

async function setReadAheadKB(sizeKB) {
  d(`Applying read-ahead size of ${sizeKB} KB to all queues...`);

  // Menyusun perintah untuk mengubah read_ahead_kb
  const command = `
    for queue in /sys/block/*/queue; do
      echo ${sizeKB} > $queue/read_ahead_kb;
    done
  `;

  await c(`su -c '${command.replace(/\n/g, "")}'`);
  d(`${sizeKB} KB read-ahead applied to all queues.`);
}

document.addEventListener("DOMContentLoaded", async () => {
  const nrRequestsSelect = document.getElementById("nrRequestsSelect");
  
  // Mendapatkan nilai yang dipilih dari select
  const state = localStorage.getItem("nrRequestsState");

  if (state !== null) {
    nrRequestsSelect.value = state;
  }

  nrRequestsSelect.addEventListener("change", async () => {
    const selectedValue = nrRequestsSelect.value;
    localStorage.setItem("nrRequestsState", selectedValue);
    await setNrRequests(selectedValue);
  });
});

async function setNrRequests(size) {
  d(`Applying nr_requests size of ${size} to all queues...`);

  // Menyusun perintah untuk mengubah nr_requests
  const command = `
    for queue in /sys/block/*/queue; do
      echo ${size} > $queue/nr_requests;
    done
  `;

  await c(`su -c '${command.replace(/\n/g, "")}'`);
  d(`${size} nr_requests applied to all queues.`);
}

async function toggleentropy(enable) {
  d("Toggling Kernel Entropy...");

  if (enable) {
    await c("su -c 'entropy=$(cat /proc/sys/kernel/random/poolsize); \
echo 1024 > /proc/sys/kernel/random/read_wakeup_threshold; \
echo \"$entropy\" > /proc/sys/kernel/random/write_wakeup_threshold; \
echo \"$entropy\" > /proc/sys/kernel/random/entropy_avail; \
cat /proc/sys/kernel/random/entropy_avail'");
    d("Kernel entropy maximum.");
  } else {
    await c("su -c 'entropy=$(cat /proc/sys/kernel/random/poolsize); \
echo 1024 > /proc/sys/kernel/random/read_wakeup_threshold; \
echo \"$entropy\" > /proc/sys/kernel/random/write_wakeup_threshold; \
echo \"$entropy\" > /proc/sys/kernel/random/entropy_avail; \
cat /proc/sys/kernel/random/entropy_avail'");
    d("Kernel entropy maximum.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("entropyToggle");
  const state = localStorage.getItem("entropyState");

  if (state !== null) toggle.checked = JSON.parse(state);

  toggle.addEventListener("change", () => {
    localStorage.setItem("entropyState", JSON.stringify(toggle.checked));
    toggleentropy(toggle.checked);
  });
});

async function setKernelMode(mode) {
    d(`Applying ${mode} Kernel Threads Mode...`);

    let command = "";

    switch (mode.toLowerCase()) {
        case "normal":
            command = "ulimit -s 8192; ulimit -i 20480; ulimit -v unlimited; echo 32768 > /proc/sys/kernel/pid_max; echo 65530 > /proc/sys/vm/max_map_count; echo 85399 > /proc/sys/kernel/threads-max;";
            break;
        case "Lowered":
            command = "ulimit -s 4096; ulimit -i 10000; ulimit -v 512000; echo 16384 > /proc/sys/kernel/pid_max; echo 32768 > /proc/sys/vm/max_map_count; echo 32768 > /proc/sys/kernel/threads-max;";
            break;
        case "Boosted":
            command = "ulimit -s 4096; ulimit -i 60000; ulimit -v unlimited; echo 100000 > /proc/sys/kernel/pid_max; echo 262144 > /proc/sys/vm/max_map_count; echo 100000 > /proc/sys/kernel/threads-max;";
            break;
        case "extreme":
            command = "ulimit -s 256; ulimit -i 120000; ulimit -v unlimited; echo 200000 > /proc/sys/kernel/pid_max; echo 600000 > /proc/sys/vm/max_map_count; echo 120000 > /proc/sys/kernel/threads-max;";
            break;
        default:
            d("Unknown mode selected.");
            return;
    }

    // Direct command execution
    await c(`su -c '${command}'`);
    d(`${mode} Kernel Threads mode applied.`);
}

document.addEventListener("DOMContentLoaded", () => {
    const kernelModeSelect = document.getElementById("KernelModeSelect");

    const savedKernelMode = localStorage.getItem("KernelMode");
    if (savedKernelMode) {
        kernelModeSelect.value = savedKernelMode;
    }

    kernelModeSelect.addEventListener("change", () => {
        const selectedMode = kernelModeSelect.value;
        localStorage.setItem("KernelMode", selectedMode);
        setKernelMode(selectedMode);
    });
});
async function setVfsLevel(value) {
    await c(`su -c 'echo ${value} > /proc/sys/vm/vfs_cache_pressure'`);
    d(`Vfs cache pressure level set to ${value}`);
}

async function setWsFLevel(value) {
    await c(`su -c 'echo ${value} > /proc/sys/vm/watermark_scale_factor'`);
    d(`Watermark scale factor level set to ${value}`);
}

document.addEventListener("DOMContentLoaded", () => {
    // Watermark scale factor
    const WsFSlider = document.getElementById("WsFSlider");
    const WsFValue = document.getElementById("WsFValue");
    WsFValue.textContent = WsFSlider.value;
    WsFSlider.addEventListener("input", async () => {
        const value = WsFSlider.value;
        WsFValue.textContent = value;
        await setWsFLevel(value);
    });

    // Vfs cache pressure
    const VfsSlider = document.getElementById("VfsSlider");
    const VfsValue = document.getElementById("VfsValue");
    VfsValue.textContent = VfsSlider.value;
    VfsSlider.addEventListener("input", async () => {
        const value = VfsSlider.value;
        VfsValue.textContent = value;
        await setVfsLevel(value);
    });
});


async function setSwappinessLevel(value) {
    await c(`su -c 'echo ${value} > /proc/sys/vm/swappiness'`);
    d(`Swappiness level set to ${value}`);
}

document.addEventListener("DOMContentLoaded", () => {
    const swappinessSlider = document.getElementById("swappinessSlider");
    const swappinessValue = document.getElementById("swappinessValue");

    // Initial display
    swappinessValue.textContent = swappinessSlider.value;

    swappinessSlider.addEventListener("input", async () => {
        const value = swappinessSlider.value;
        swappinessValue.textContent = value;
        await setSwappinessLevel(value);
    });
});

async function toggleThermalv3(enable) {
    d("Process status thermal...");

    if (enable) {
        await c("su -c 'pid=$(ps -e | grep thermal | awk '\\''{print $2}'\\''); if [ -n \"$pid\" ]; then kill -SIGSTOP $pid; fi'");
        d("Process status thermal disabled.");
    } else {
        await c("su -c 'pid=$(ps -e | grep thermal | awk '\\''{print $2}'\\''); if [ -n \"$pid\" ]; then kill -SIGCONT $pid; fi'");
        d("Process status thermal enabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("Thermalv3Toggle");
    const state = localStorage.getItem("Thermalv3ToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("Thermalv3ToggleState", JSON.stringify(toggle.checked));
        toggleThermalv3(toggle.checked);
    });
});

async function toggleSchedEnergyAware(enable) {
  d("Toggling Sched Energy Aware...");

  if (enable) {
    await c("su -c 'echo 1 > /proc/sys/kernel/sched_energy_aware'");
    d("Sched Energy Aware Enabled.");
  } else {
    await c("su -c 'echo 0 > /proc/sys/kernel/sched_energy_aware'");
    d("Sched Energy Aware Disabled.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("schedEnergyAwareToggle");
  const state = localStorage.getItem("schedEnergyAwareState");

  if (state !== null) toggle.checked = JSON.parse(state);

  toggle.addEventListener("change", () => {
    localStorage.setItem("schedEnergyAwareState", JSON.stringify(toggle.checked));
    toggleSchedEnergyAware(toggle.checked);
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const set = (id, val) => document.getElementById(id).textContent = val.trim() || "Unknown";

  const getCPU = async () => {
    const { stdout: platform } = await c("getprop ro.board.platform");
    let prefix = "Unknown";

    if (/mt/i.test(platform)) prefix = "MediaTek";
    else if (/sdm|sm|qcom|qualcomm/i.test(platform)) prefix = "Qualcomm";
    else if (/exynos/i.test(platform)) prefix = "Samsung";
    else if (/hisilicon|kirin/i.test(platform)) prefix = "HiSilicon";
    else if (/unisoc/i.test(platform)) prefix = "Unisoc";
    
    return `${prefix} ${platform.toUpperCase()}`;
  };

  const getGPU = async () => {
    const { stdout } = await c("cat /sys/kernel/gpu/gpu_model");
    if (stdout.trim()) return stdout;
    const fallback = await c("dumpsys SurfaceFlinger | grep GLES | head -1 | cut -d':' -f2");
    return fallback.stdout;
  };

  const getMem = async () => {
    const { stdout } = await c("free -m | grep Mem | awk '{printf \"%dMiB / %dMiB\", $3, $2}'");
    return stdout;
  };

  set("osVer", (await c("getprop ro.build.version.release")).stdout);
  set("kernelVer", (await c("uname -r")).stdout);
  set("uptime", (await c("uptime -p")).stdout);
  set("res", (await c("wm size | awk '{print $3}'")).stdout);
  set("cpu", await getCPU());
  set("gpu", await getGPU());
  set("mem", await getMem());
});

// Update nilai real-time untuk downscale
document.getElementById('downscale').addEventListener('input', function () {
  document.getElementById('downscaleVal').textContent = this.value;
});

async function runShellCommand(command) {
    // Placeholder untuk menjalankan perintah shell
    console.log(`Running command: ${command}`);
    // Biasanya di sini lo bisa panggil sesuatu yang bisa ngejalanin perintah shell di sistem lo
    // Misalnya, via Node.js atau metode lain yang sesuai
}

// Fungsi untuk menjalankan shell command secara async/await
// Fungsi untuk menjalankan shell command secara async/await
async function executeShellCommand(command) {
  try {
    // Menjalankan perintah shell dengan su -c menggunakan await
    const output = await c(`su -c '${command}'`);
    return output;
  } catch (error) {
    console.error("Error executing command:", error);
    return `Error: ${error.message}`;
  }
}

// Update nilai real-time untuk fps
document.getElementById('fps').addEventListener('input', function () {
  document.getElementById('fpsVal').textContent = this.value;
});

async function onEnter() {
  const pkg = document.getElementById('packageName').value.trim();
  if (!pkg) return alert('Enter the game package name!');

  document.getElementById('mode-select').style.display = 'block';
  document.getElementById('downscale-ui').style.display = 'block';
  document.getElementById('fps-ui').style.display = 'block';
  document.getElementById('done-section').style.display = 'block';
}

async function onDone() {
  const pkg = document.getElementById('packageName').value.trim();
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const downscale = document.getElementById('downscale').value;
  const fps = document.getElementById('fps').value || 0;

  if (!pkg) return alert('Enter the game package name!');

  let command = `cmd game mode ${mode} ${pkg};`;

  // Terapkan downscale & fps di mode 2, 3, dan 4
  if (["2", "3", "4"].includes(mode)) {
    command += ` cmd game set --downscale ${downscale} --fps ${fps} ${pkg};`;
  }

  document.getElementById('status').textContent = 'Menjalankan perintah...';

  const output = await executeShellCommand(command);

  document.getElementById('status').textContent = 'Selesai:\n' + output;
}

async function onReset() {
  const pkg = document.getElementById('packageName').value.trim();
  if (!pkg) return alert('Masukkan nama package game!');

  const command = `cmd game reset ${pkg}`;

  document.getElementById('status').textContent = 'Resetting...';

  // Menjalankan perintah reset dengan async/await
  const output = await executeShellCommand(command);

  document.getElementById('status').textContent = 'Reset selesai:\n' + output;
}

document.addEventListener("DOMContentLoaded", () => {
  const selectBtn = document.getElementById("selectCountryBtn");
  const modal = document.getElementById("countryModal");
  const cancelBtn = document.getElementById("cancelCountryBtn");
  const applyBtn = document.getElementById("applyCountryBtn");
  const countrySelect = document.getElementById("countrySelect");

  // List of countries with their ISO 3166-1 alpha-2 codes
  const countries = [
    { code: "AF", name: "Afghanistan" },
    { code: "AX", name: "Åland Islands" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AS", name: "American Samoa" },
    { code: "AD", name: "Andorra" },
    { code: "AO", name: "Angola" },
    { code: "AI", name: "Anguilla" },
    { code: "AQ", name: "Antarctica" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AW", name: "Aruba" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BS", name: "Bahamas" },
    { code: "BH", name: "Bahrain" },
    { code: "BD", name: "Bangladesh" },
    { code: "BB", name: "Barbados" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BZ", name: "Belize" },
    { code: "BJ", name: "Benin" },
    { code: "BM", name: "Bermuda" },
    { code: "BT", name: "Bhutan" },
    { code: "BO", name: "Bolivia" },
    { code: "BQ", name: "Bonaire, Sint Eustatius and Saba" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BW", name: "Botswana" },
    { code: "BV", name: "Bouvet Island" },
    { code: "BR", name: "Brazil" },
    { code: "IO", name: "British Indian Ocean Territory" },
    { code: "BN", name: "Brunei Darussalam" },
    { code: "BG", name: "Bulgaria" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BI", name: "Burundi" },
    { code: "KH", name: "Cambodia" },
    { code: "CM", name: "Cameroon" },
    { code: "CA", name: "Canada" },
    { code: "CV", name: "Cape Verde" },
    { code: "KY", name: "Cayman Islands" },
    { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CX", name: "Christmas Island" },
    { code: "CC", name: "Cocos (Keeling) Islands" },
    { code: "CO", name: "Colombia" },
    { code: "KM", name: "Comoros" },
    { code: "CG", name: "Congo" },
    { code: "CD", name: "Congo, Democratic Republic of the" },
    { code: "CK", name: "Cook Islands" },
    { code: "CR", name: "Costa Rica" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "HR", name: "Croatia" },
    { code: "CU", name: "Cuba" },
    { code: "CW", name: "Curaçao" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czechia" },
    { code: "DK", name: "Denmark" },
    { code: "DJ", name: "Djibouti" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "ER", name: "Eritrea" },
    { code: "EE", name: "Estonia" },
    { code: "SZ", name: "Eswatini" },
    { code: "ET", name: "Ethiopia" },
    { code: "FK", name: "Falkland Islands (Malvinas)" },
    { code: "FO", name: "Faroe Islands" },
    { code: "FJ", name: "Fiji" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GF", name: "French Guiana" },
    { code: "PF", name: "French Polynesia" },
    { code: "TF", name: "French Southern Territories" },
    { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" },
    { code: "GE", name: "Georgia" },
    { code: "DE", name: "Germany" },
    { code: "GH", name: "Ghana" },
    { code: "GI", name: "Gibraltar" },
    { code: "GR", name: "Greece" },
    { code: "GL", name: "Greenland" },
    { code: "GD", name: "Grenada" },
    { code: "GP", name: "Guadeloupe" },
    { code: "GU", name: "Guam" },
    { code: "GT", name: "Guatemala" },
    { code: "GG", name: "Guernsey" },
    { code: "GN", name: "Guinea" },
    { code: "GW", name: "Guinea-Bissau" },
    { code: "GY", name: "Guyana" },
    { code: "HT", name: "Haiti" },
    { code: "VA", name: "Holy See" },
    { code: "HN", name: "Honduras" },
    { code: "HK", name: "Hong Kong" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IE", name: "Ireland" },
    { code: "IM", name: "Isle of Man" },
    { code: "IT", name: "Italy" },
    { code: "JM", name: "Jamaica" },
    { code: "JP", name: "Japan" },
    { code: "JE", name: "Jersey" },
    { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "KE", name: "Kenya" },
    { code: "KI", name: "Kiribati" },
    { code: "KP", name: "Korea, North" },
    { code: "KR", name: "Korea, South" },
    { code: "KW", name: "Kuwait" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Lao People's Democratic Republic" },
    { code: "LV", name: "Latvia" },
    { code: "LB", name: "Lebanon" },
    { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" },
    { code: "LY", name: "Libya" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MO", name: "Macao" },
    { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" },
    { code: "MY", name: "Malaysia" },
    { code: "MV", name: "Maldives" },
    { code: "ML", name: "Mali" },
    { code: "MT", name: "Malta" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MQ", name: "Martinique" },
    { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" },
    { code: "YT", name: "Mayotte" },
    { code: "MX", name: "Mexico" },
    { code: "FM", name: "Micronesia" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "MN", name: "Mongolia" },
    { code: "ME", name: "Montenegro" },
    { code: "MS", name: "Montserrat" },
    { code: "MA", name: "Morocco" },
    { code: "MZ", name: "Mozambique" },
    { code: "MM", name: "Myanmar" },
    { code: "NA", name: "Namibia" },
    { code: "NR", name: "Nauru" },
    { code: "NP", name: "Nepal" },
    { code: "NL", name: "Netherlands" },
    { code: "NC", name: "New Caledonia" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "NE", name: "Niger" },
    { code: "NG", name: "Nigeria" },
    { code: "NU", name: "Niue" },
    { code: "NF", name: "Norfolk Island" },
    { code: "MK", name: "North Macedonia" },
    { code: "MP", name: "Northern Mariana Islands" },
    { code: "NO", name: "Norway" },
    { code: "OM", name: "Oman" },
    { code: "PK", name: "Pakistan" },
    { code: "PW", name: "Palau" },
    { code: "PS", name: "Palestine, State of" },
    { code: "PA", name: "Panama" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "PR", name: "Puerto Rico" },
    { code: "QA", name: "Qatar" },
    { code: "RE", name: "Réunion" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russian Federation" },
    { code: "RW", name: "Rwanda" },
    // ... kalau mau lengkap bisa dilanjut, tapi ini sudah > 100 negara
  ];

  // Populate select dropdown
  countries.forEach(c => {
    const option = document.createElement("option");
    option.value = c.code;
    option.textContent = `${c.name} (${c.code})`;
    countrySelect.appendChild(option);
  });

  selectBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  applyBtn.addEventListener("click", async () => {
    const selectedCode = countrySelect.value;
    d(`Applying WiFi country code: ${selectedCode}`);
    await c(`su -c 'cmd wifi force-country-code enabled ${selectedCode}'`);
    modal.classList.add("hidden");
  });
});


async function toggleCmdLoggingDisable(enable) {
    d("Toggling CMD Logging Disable...");

    if (enable) {
        await c("su -c 'cmd stats clear-puller-cache'");
        await c("su -c 'cmd display ab-logging-disable'");
        await c("su -c 'cmd display dwb-logging-disable'");
        await c("su -c 'cmd looper_stats disable'");
        d("CMD Logging Disabled.");
    } else {
        d("CMD Logging toggle OFF. (No revert commands available)");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("cmdLoggingToggle");
    const state = localStorage.getItem("cmdLoggingToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("cmdLoggingToggleState", JSON.stringify(toggle.checked));
        toggleCmdLoggingDisable(toggle.checked);
    });
});

async function toggleWifi40MHz(enable) {
    d("Toggling 40MHz on 2.4GHz WiFi...");

    if (enable) {
        await c("su -c 'echo N > /sys/module/cfg80211/parameters/cfg80211_disable_40mhz_24ghz'");
        d("40MHz Enabled on 2.4GHz WiFi.");
    } else {
        await c("su -c 'echo Y > /sys/module/cfg80211/parameters/cfg80211_disable_40mhz_24ghz'");
        d("40MHz Disabled (Using 20MHz on 2.4GHz).");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("wifi40mhzToggle");
    const state = localStorage.getItem("wifi40mhzToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("wifi40mhzToggleState", JSON.stringify(toggle.checked));
        toggleWifi40MHz(toggle.checked);
    });
});

async function toggleMLBB120fps(enable) {
    d("Toggling Mobile Legends 120FPS...");

    if (enable) {
        await c(`su -c '
if [ -e /data/data/com.mobile.legends/shared_prefs/com.mobile.legends.v2.playerprefs.xml ]; then
    playerprefs=/data/data/com.mobile.legends/shared_prefs/com.mobile.legends.v2.playerprefs.xml
    if grep -q "HighFpsModeSee" $playerprefs; then
        sed -i "s/\\"HighFpsModeSee\\" value=\\"[1-4]\\"/\\"HighFpsModeSee\\" value=\\"4\\"/" $playerprefs
    fi
    if grep -q "PerformanceDevice_BestQuality_new" $playerprefs; then
        sed -i "s/\\"PerformanceDevice_BestQuality_new\\" value=\\"[1-4]\\"/\\"PerformanceDevice_BestQuality_new\\" value=\\"4\\"/" $playerprefs
    fi
    if grep -q "PreformanceLv" $playerprefs; then
        sed -i "s/\\"PreformanceLv\\" value=\\"[1-4]\\"/\\"PreformanceLv\\" value=\\"4\\"/" $playerprefs
    fi
fi
'`);
        d("120FPS Enabled for Mobile Legends.");
    } else {
        await c(`su -c '
if [ -e /data/data/com.mobile.legends/shared_prefs/com.mobile.legends.v2.playerprefs.xml ]; then
    playerprefs=/data/data/com.mobile.legends/shared_prefs/com.mobile.legends.v2.playerprefs.xml
    if grep -q "HighFpsModeSee" $playerprefs; then
        sed -i "s/\\"HighFpsModeSee\\" value=\\"[1-4]\\"/\\"HighFpsModeSee\\" value=\\"2\\"/" $playerprefs
    fi
    if grep -q "PerformanceDevice_BestQuality_new" $playerprefs; then
        sed -i "s/\\"PerformanceDevice_BestQuality_new\\" value=\\"[1-4]\\"/\\"PerformanceDevice_BestQuality_new\\" value=\\"2\\"/" $playerprefs
    fi
    if grep -q "PreformanceLv" $playerprefs; then
        sed -i "s/\\"PreformanceLv\\" value=\\"[1-4]\\"/\\"PreformanceLv\\" value=\\"2\\"/" $playerprefs
    fi
fi
'`);
        d("120FPS Disabled (back to normal settings).");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("mlbb120fpsToggle");
    const state = localStorage.getItem("mlbb120fpsToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("mlbb120fpsToggleState", JSON.stringify(toggle.checked));
        toggleMLBB120fps(toggle.checked);
    });
});

document.getElementById('donateButton').addEventListener('click', () => {
  window.open('https://t.me/ZuanVFX', '_blank');
});

async function toggleKernelTweak(enable) {
    d("Applying Kernel Tweak changes...");

    if (enable) {
        await c("su -c 'echo 1 > /proc/sys/kernel/perf_cpu_time_max_percent; echo off > /proc/sys/kernel/printk_devkmsg; echo 0 > /sys/kernel/tracing/tracing_on; echo -1 > /proc/sys/kernel/perf_event_paranoid; stop traced; stop statsd'");
        d("Kernel Tweak Enabled.");
    } else {
        await c("su -c 'echo 25 > /proc/sys/kernel/perf_cpu_time_max_percent; echo on > /proc/sys/kernel/printk_devkmsg; echo 1 > /sys/kernel/tracing/tracing_on; echo -1 > /proc/sys/kernel/perf_event_paranoid; start traced; start statsd'");
        d("Kernel Tweak Disabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const kernelTweakCheckbox = document.getElementById("KernelTweakToggle");
    const savedKernelTweakState = localStorage.getItem("KernelTweakState");

    if (savedKernelTweakState !== null) {
        kernelTweakCheckbox.checked = JSON.parse(savedKernelTweakState);
    }

    kernelTweakCheckbox.addEventListener("change", () => {
        localStorage.setItem("KernelTweakState", JSON.stringify(kernelTweakCheckbox.checked));
        toggleKernelTweak(kernelTweakCheckbox.checked);
    });
});

async function toggleSpeedMode(enable) {
    d("Applying Speed Mode...");

    if (enable) {
        await c("su -c 'settings put system POWER_SAVE_PRE_HIDE_MODE performance; settings put secure high_priority 1; settings put secure speed_mode_enable 1; settings put system speed_mode 1'");
        d("Speed Mode Enabled.");
    } else {
        await c("su -c 'settings put system POWER_SAVE_PRE_HIDE_MODE powersave; settings put secure high_priority 0; settings put secure speed_mode_enable 0; settings put system speed_mode 0'");
        d("Speed Mode Disabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("SpeedModeToggle");
    const state = localStorage.getItem("SpeedModeToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("SpeedModeToggleState", JSON.stringify(toggle.checked));
        toggleSpeedMode(toggle.checked);
    });
});

async function toggleKillLog(enable) {
    d("Toggling Logger...");

    if (enable) {
        await c("su -c 'am kill logd; killall -9 logd; stop logd'");
        d("Logger Disabled.");
    } else {
        await c("su -c 'start logd'");
        d("Logger Enabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("KillLoGToggle");
    const state = localStorage.getItem("KillLoGToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("KillLoGToggleState", JSON.stringify(toggle.checked));
        toggleKillLog(toggle.checked);
    });
});

async function togglePowerEfficiency(enable) {
    d("Toggling Power Efficiency...");

    if (enable) {
        await c("su -c 'chmod 644 /sys/module/workqueue/parameters/power_efficient; echo N > /sys/module/workqueue/parameters/power_efficient'");
        d("Power Efficiency Disabled.");
    } else {
        await c("su -c 'chmod 644 /sys/module/workqueue/parameters/power_efficient; echo Y > /sys/module/workqueue/parameters/power_efficient'");
        d("Power Efficiency Enabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("PowerEfficiencyToggle");
    const state = localStorage.getItem("PowerEfficiencyToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("PowerEfficiencyToggleState", JSON.stringify(toggle.checked));
        togglePowerEfficiency(toggle.checked);
    });
});

async function toggle120hz(enable) {
    d("Toggling 120hz Mode...");

    if (enable) {
        await c("su -c 'service call SurfaceFlinger 1035 i32 1'");
        d("120Hz Enabled.");
    } else {
        await c("su -c 'service call SurfaceFlinger 1035 i32 0'");
        d("120Hz Disabled Apply 60hz.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("120hzToggle");
    const state = localStorage.getItem("120hzToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("120hzToggleState", JSON.stringify(toggle.checked));
        toggle120hz(toggle.checked);
    });
});

async function toggleKernelPanic(enable) {
    d("Toggling Kernel Panic...");

    if (enable) {
        await c("su -c 'echo 0 > /proc/sys/kernel/panic; echo 0 > /proc/sys/kernel/panic_on_oops; echo 0 > /proc/sys/kernel/panic_on_rcu_stall; echo 0 > /proc/sys/kernel/panic_on_warn; echo 0 > /proc/sys/kernel/softlockup_panic; echo 0 > /sys/module/kernel/parameters/panic; echo 0 > /sys/module/kernel/parameters/panic_on_warn; echo 0 > /sys/module/kernel/parameters/panic_on_oops; echo 0 > /proc/sys/vm/oom_dump_tasks; echo 0 > /proc/sys/vm/panic_on_oom'");
        d("Kernel Panic Disabled.");
    } else {
        await c("su -c 'echo 1 > /proc/sys/kernel/panic; echo 1 > /proc/sys/kernel/panic_on_oops; echo 1 > /proc/sys/kernel/panic_on_rcu_stall; echo 1 > /proc/sys/kernel/panic_on_warn; echo 1 > /proc/sys/kernel/softlockup_panic; echo 1 > /sys/module/kernel/parameters/panic; echo 1 > /sys/module/kernel/parameters/panic_on_warn; echo 1 > /sys/module/kernel/parameters/panic_on_oops; echo 1 > /proc/sys/vm/oom_dump_tasks; echo 1 > /proc/sys/vm/panic_on_oom'");
        d("Kernel Panic Enabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("KernelPanicToggle");
    const state = localStorage.getItem("KernelPanicToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("KernelPanicToggleState", JSON.stringify(toggle.checked));
        toggleKernelPanic(toggle.checked);
    });
});

async function togglePerfmgr(enable) {
    d("Toggling Perfmgr...");

    if (enable) {
        await c("su -c 'echo 1 > /sys/module/perfmgr/parameters/perfmgr_enable'");
        d("Perfmgr Enabled.");
    } else {
        await c("su -c 'echo 0 > /sys/module/perfmgr/parameters/perfmgr_enable'");
        d("Perfmgr Disabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("PerfmgrToggle");
    const state = localStorage.getItem("PerfmgrToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("PerfmgrToggleState", JSON.stringify(toggle.checked));
        togglePerfmgr(toggle.checked);
    });
});

async function toggleIOStats(enable) {
    d("Toggling IO Stats...");

    if (enable) {
        await c("su -c 'for queue in /sys/block/*/queue; do echo 0 > $queue/iostats; done; echo 0 > /dev/sys/fs/by-name/userdata/iostat_enable; echo 0 > /sys/fs/f2fs_dev/mmcblk0p79/iostat_enable; echo 0 > /proc/sys/kernel/sched_schedstats'");
        d("IO Stats Disabled.");
    } else {
        await c("su -c 'for queue in /sys/block/*/queue; do echo 1 > $queue/iostats; done; echo 1 > /dev/sys/fs/by-name/userdata/iostat_enable; echo 1 > /sys/fs/f2fs_dev/mmcblk0p79/iostat_enable; echo 1 > /proc/sys/kernel/sched_schedstats'");
        d("IO Stats Enabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("IOStatsToggle");
    const state = localStorage.getItem("IOStatsToggleState");

    if (state !== null) toggle.checked = JSON.parse(state);

    toggle.addEventListener("change", () => {
        localStorage.setItem("IOStatsToggleState", JSON.stringify(toggle.checked));
        toggleIOStats(toggle.checked);
    });
});

async function setSaturationLevel(value) {
    const floatValue = (value / 10).toFixed(1);
    await c(`service call SurfaceFlinger 1022 f ${floatValue}`);
    d(`Saturation level set to ${floatValue}`);
}

document.addEventListener("DOMContentLoaded", () => {
    const saturationSlider = document.getElementById("saturationSlider");
    const saturationValue = document.getElementById("saturationValue");

    // Initial display
    saturationValue.textContent = `${(saturationSlider.value / 10).toFixed(1)}`;

    saturationSlider.addEventListener("input", async () => {
        const floatVal = (saturationSlider.value / 10).toFixed(1);
        saturationValue.textContent = floatVal;
        await setSaturationLevel(saturationSlider.value);
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById("busmonGovernorModal");
    const toggleBtn = document.getElementById("busmonGovernorToggle");
    const closeBtn = document.getElementById("closeBusmonGovernor");
    const optionsContainer = document.getElementById("busmonGovernorOptions");

    // Daftar governor yang tersedia
    const governors = ["performance", "powersave", "gpubw_mon", "simple_ondemand"];

    // Tambahin opsi ke modal
    governors.forEach((gov) => {
        const option = document.createElement("button");
        option.className = "w-full text-left bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600";
        option.innerText = gov;
        option.addEventListener("click", async () => {
            await setBusmonGovernor(gov);
            modal.classList.add("hidden");
        });
        optionsContainer.appendChild(option);
    });

    // Buka modal saat tombol dipencet
    toggleBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    // Tutup modal
    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Fungsi buat ganti governor
    async function setBusmonGovernor(governor) {
        const path = "/sys/class/devfreq/kgsl-busmon/governor";
        await c(`su -c 'echo ${governor} > ${path}'`);
        d(`KGSL Busmon Governor changed to ${governor}`);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("cpuGovernorModal");
  const toggleBtn = document.getElementById("cpuGovernorToggle");
  const closeBtn = document.getElementById("closeCpuGovernor");
  const optionsContainer = document.getElementById("cpuGovernorOptions");

  // Daftar CPU governor yang tersedia
  const governors = ["performance", "powersave", "walt", "schedutil", "conservative"];

  // Tambahin opsi ke modal
  governors.forEach((gov) => {
    const option = document.createElement("button");
    option.className = "w-full text-left bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600";
    option.innerText = gov;
    option.addEventListener("click", async () => {
      await setCpuGovernor(gov);
      modal.classList.add("hidden");
    });
    optionsContainer.appendChild(option);
  });

  // Buka modal saat tombol dipencet
  toggleBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  // Tutup modal
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Fungsi buat ganti CPU governor (disamakan dengan UFS cara kerjanya)
  async function setCpuGovernor(governor) {
    const command = `
      for policy_dir in /sys/devices/system/cpu/cpufreq/*; do
        chmod 0666 "$policy_dir/scaling_governor"
        echo ${governor} > "$policy_dir/scaling_governor"
      done
    `;
    await c(`su -c '${command}'`);
    d(`CPU Governor changed to ${governor}`);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById("ufsGovernorModal");
    const toggleBtn = document.getElementById("ufsGovernorToggle");
    const closeBtn = document.getElementById("closeUfsGovernor");
    const optionsContainer = document.getElementById("ufsGovernorOptions");

    // Daftar governor UFSHC yang tersedia
    const governors = ["performance", "powersave", "userspace", "simple_ondemand"];

    // Tambahin opsi ke modal
    governors.forEach((gov) => {
        const option = document.createElement("button");
        option.className = "w-full text-left bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600";
        option.innerText = gov;
        option.addEventListener("click", async () => {
            await setUfsGovernor(gov);
            modal.classList.add("hidden");
        });
        optionsContainer.appendChild(option);
    });

    // Buka modal saat tombol dipencet
    toggleBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    // Tutup modal
    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Fungsi buat ganti governor UFSHC
    async function setUfsGovernor(governor) {
        const path = "/sys/devices/platform/soc/1d84000.ufshc/devfreq/1d84000.ufshc/governor";
        await c(`su -c 'echo ${governor} > ${path}'`);
        d(`UFSHC Governor changed to ${governor}`);
    }
});

// Fungsi untuk update status dan simpan ke localStorage
async function toggleGpuThrottling(enable) {
    d("Mengubah GPU Throttling...");

    let command = enable
        ? "su -c 'chmod 0666 /sys/class/kgsl/kgsl-3d0/throttling && echo 1 > /sys/class/kgsl/kgsl-3d0/throttling && chmod 0444 /sys/class/kgsl/kgsl-3d0/'"
        : "su -c 'chmod 0666 /sys/class/kgsl/kgsl-3d0/throttling && echo 0 > /sys/class/kgsl/kgsl-3d0/throttling && chmod 0666 /sys/class/kgsl/kgsl-3d0/thermal_pwrlevel && echo 0 > /sys/class/kgsl/kgsl-3d0/thermal_pwrlevel && chmod 0444 /sys/class/kgsl/kgsl-3d0/'";

    await c(command);
    d(enable ? "GPU Throttling Disabled" : "GPU Throttling Enabled");
}

// Fungsi untuk Auto Perf/Pwrsaving
async function toggleautoPerf(enable) {
    d("Mengubah Auto Perf/Pwrsaving...");

    let command = enable
        ? "cmd thermalservice override-status 0 && cmd power set-fixed-performance-mode-enabled true && cmd power set-adaptive-power-saver-enabled false"
        : "cmd thermalservice override-status 1 && cmd power set-fixed-performance-mode-enabled false && cmd power set-adaptive-power-saver-enabled true";

    await c(command);
    d(enable ? "Performance Mode Enabled" : "Power Saving Mode Enabled");
}

// Fungsi untuk Disable Qcom LPM
async function toggleQcomLpm(enable) {
    d("Mengubah Qcom LPM...");

    let command = enable
        ? "echo Y > /sys/devices/system/cpu/qcom_lpm/parameters/sleep_disabled && echo Y > /sys/devices/system/cpu/qcom_lpm/parameters/prediction_disabled"
        : "echo N > /sys/devices/system/cpu/qcom_lpm/parameters/sleep_disabled && echo N > /sys/devices/system/cpu/qcom_lpm/parameters/prediction_disabled";

    await c(command);
    d(enable ? "Qcom LPM Dinonaktifkan" : "Qcom LPM Diaktifkan");
}

// Event listener buat masing-masing toggle
document.addEventListener("DOMContentLoaded", async () => {
    const gpuThrottlingCheckbox = document.getElementById("gpuThrottlingToggle");
    const autoPerfCheckbox = document.getElementById("autoPerfToggle");
    const qcomLpmCheckbox = document.getElementById("qcomLpmToggle");

    // Load state dari localStorage
    gpuThrottlingCheckbox.checked = JSON.parse(localStorage.getItem("gpuThrottlingState")) || false;
    autoPerfCheckbox.checked = JSON.parse(localStorage.getItem("autoPerfState")) || false;
    qcomLpmCheckbox.checked = JSON.parse(localStorage.getItem("qcomLpmState")) || false;

    // Tambahkan event listener untuk setiap tombol
    gpuThrottlingCheckbox.addEventListener("change", () => {
        localStorage.setItem("gpuThrottlingState", JSON.stringify(gpuThrottlingCheckbox.checked));
        toggleGpuThrottling(gpuThrottlingCheckbox.checked);
    });

    autoPerfCheckbox.addEventListener("change", () => {
        localStorage.setItem("autoPerfState", JSON.stringify(autoPerfCheckbox.checked));
        toggleautoPerf(autoPerfCheckbox.checked);
    });

    qcomLpmCheckbox.addEventListener("change", () => {
        localStorage.setItem("qcomLpmState", JSON.stringify(qcomLpmCheckbox.checked));
        toggleQcomLpm(qcomLpmCheckbox.checked);
    });
});


document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById("ioSchedulerModal");
    const toggleBtn = document.getElementById("ioSchedulerToggle");
    const closeBtn = document.getElementById("closeIoScheduler");
    const optionsContainer = document.getElementById("ioSchedulerOptions");

    // List scheduler yang tersedia (sesuai output yang sebelumnya lu dapet)
    const schedulers = ["mq-deadline", "kyber", "bfq", "none"];

    // Tambahin opsi ke modal
    schedulers.forEach((scheduler) => {
        const option = document.createElement("button");
        option.className = "w-full text-left bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600";
        option.innerText = scheduler;
        option.addEventListener("click", async () => {
            await setIOScheduler(scheduler); // <-- Perbaikan ada di sini
            modal.classList.add("hidden");
        });
        optionsContainer.appendChild(option);
    });

    // Buka modal pas tombol dipencet
    toggleBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    // Tutup modal
    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Fungsi buat nge-set scheduler via shell
    async function setIOScheduler(scheduler) {
        await c(`su -c 'for queue in /sys/block/*/queue; do echo "${scheduler}" > $queue/scheduler; done'`);
        d(`I/O Scheduler changed to ${scheduler}`);
    }
});

async function toggleHWC(enable) {
    d("Applying changes to HWC...");

    if (enable) {
        await c("su -c 'service call SurfaceFlinger 1008 i32 0'");
        d("HWC Enabled.");
    } else {
        await c("su -c 'service call SurfaceFlinger 1008 i32 1'");
        d("HWC Disabled.");
    }
}

// Load state dari storage
document.addEventListener("DOMContentLoaded", async () => {
    const hwcCheckbox = document.getElementById("hwcToggle");
    const savedHwcState = localStorage.getItem("hwcState");

    if (savedHwcState !== null) {
        hwcCheckbox.checked = JSON.parse(savedHwcState);
    }

    hwcCheckbox.addEventListener("change", () => {
        localStorage.setItem("hwcState", JSON.stringify(hwcCheckbox.checked));
        toggleHWC(hwcCheckbox.checked);
    });
});

async function toggleUfshcPowerSaving(enable) {
    d("Applying UFSHC Power Saving changes...");

    if (enable) {
        await c("su -c 'echo 0 > /sys/devices/platform/soc/1d84000.ufshc/clkgate_enable'");
        d("UFSHC Power Saving Disabled.");
    } else {
        await c("su -c 'echo 1 > /sys/devices/platform/soc/1d84000.ufshc/clkgate_enable'");
        d("UFSHC Power Saving Enabled.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const ufshcCheckbox = document.getElementById("ufshcPowerSaving");
    const savedUfshcState = localStorage.getItem("ufshcPowerSavingState");

    if (savedUfshcState !== null) {
        ufshcCheckbox.checked = JSON.parse(savedUfshcState);
    }

    ufshcCheckbox.addEventListener("change", () => {
        localStorage.setItem("ufshcPowerSavingState", JSON.stringify(ufshcCheckbox.checked));
        toggleUfshcPowerSaving(ufshcCheckbox.checked);
    });
});


async function f() {
    const { errno, stdout } = await c("cat /sys/class/qcom-battery/fake_temp");
    if (errno === 0) {
        document.getElementById("faketemp").checked = stdout.trim() === "1";
    }
}

async function p(e) {
    d("Applying changes...");
    const tempA = e ? 5000 : 0;
    const tempB = e ? 250 : 0;
    const tempC = e ? 5 : 0;

    await c(`su -c 'echo ${tempC} > /sys/class/qcom-battery/fake_temp'`);
    await c(`su -c 'echo ${tempB} > /sys/class/power_supply/mtk-slv-div-chg/temp'`);
    await c(`su -c 'echo ${tempB} > /sys/class/power_supply/mtk-slave-charger/temp'`);
    await c(`su -c 'echo ${tempB} > /sys/class/power_supply/battery/temp'`);
    await c(`su -c 'echo ${tempB} > /sys/class/power_supply/bms/temp'`);
    await c(`su -c 'echo ${tempB} > /sys/class/power_supply/bms/cp_slave/temp'`);
    await c(`su -c 'echo ${tempC} > /sys/class/power_supply/bratty/temperature'`);
    await c(`su -c 'echo ${tempB} > /sys/class/qcom-battery/connector_temp'`);

    const thermalCommand = `
        tempA=${tempA};
        for THERMAL_ZONE in /sys/class/thermal/thermal_zone*/type; do
            EMUL_TEMP_FILE="\${THERMAL_ZONE%/*}/emul_temp";
            if [ -f "\$EMUL_TEMP_FILE" ]; then
                cat "\$THERMAL_ZONE";
                echo "\$tempA" > "\$EMUL_TEMP_FILE";
            fi
        done;
    `;
    await c(`su -c 'sh ${thermalCommand}'`);
}

async function disableZram() {
    d("Disabling ZRAM...");

    const zramDisableCommand = `
        for zram in \$(blkid | grep swap | awk -F[/:] '{print \$4}'); do
            zram_dev="/dev/block/\${zram}";
            dev_index="\$(echo \$zram | grep -o '[0-9]*\$')";
            echo \$dev_index > /sys/class/zram-control/hot_remove;
            swapoff \$zram_dev;
            echo "1" > /sys/block/\$zram/reset;
            echo "0" > /sys/block/\$zram/disksize;
        done;
    `;
    
    await c(zramDisableCommand);
    await c("setprop vnswap.enabled false");
    await c("setprop ro.config.zram false");
    await c("setprop ro.config.zram.support false");
    await c("setprop zram.disksize 0");
    await c("echo 0 > /proc/sys/vm/swappiness");

    d("Zram is disabled.");
}

async function configureZram(size) {
    d("Waiting...");

    const sizeBytes = size === 8 ? 8589934592 : 25768329216;
    const zramCommand = `
        swapoff /dev/block/zram0;
        echo "1" > /sys/block/zram0/reset;
        echo "${sizeBytes}" > /sys/block/zram0/disksize;
        mkswap /dev/block/zram0;
        swapon /dev/block/zram0;
        setprop vnswap.enabled true;
        setprop ro.config.zram true;
        setprop ro.config.zram.support true;
        setprop zram.disksize ${sizeBytes};
        echo 60 > /proc/sys/vm/swappiness;
    `;
    
    await c(zramCommand);

    d("ZRAM changes applied");
}

async function updateThermalTripPoint(value) {
    const tempMicroC = value * 1000;
    await c(`for zone in /sys/class/thermal/thermal_zone*/trip_point_*_temp; do echo ${tempMicroC} > "$zone"; done`);
    d(`Thermal trip points set to ${value}°C`);
}
async function loadThermalLimit() {
    try {
        const { errno, stdout } = await c("cat /sys/class/thermal/thermal_zone0/trip_point_0_temp");
        if (errno === 0) {
            const temp = Math.round(parseInt(stdout.trim()) / 1000); 
            const slider = document.getElementById("thermalSlider");
            const tempDisplay = document.getElementById("thermalValue");

            slider.value = temp;
            tempDisplay.textContent = `${temp}°C`;
        }
    } catch (error) {
        console.error("Error getting thermal limit:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadThermalLimit();

    const thermalSlider = document.getElementById("thermalSlider");
    const thermalValue = document.getElementById("thermalValue");

    thermalSlider.addEventListener("input", async () => {
        const temp = thermalSlider.value;
        thermalValue.textContent = `${temp}°C`;
        await updateThermalTripPoint(temp);
    });
});
async function m() {
    try {
        const { errno, stdout } = await c("grep \"version=\" /data/adb/modules/SnapSPerf/module.prop | awk -F'=' '{print $2}'");
        if (errno === 0) {
            document.getElementById("moduleVer").textContent = stdout.trim();
        } else {
            document.getElementById("moduleVer").textContent = "Version not found.";
        }
    } catch (error) {
        console.error("Error fetching module version:", error);
        document.getElementById("moduleVer").textContent = "Error loading version";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await m();
    await f();

    const faketempCheckbox = document.getElementById("faketemp");
    const savedFakeTemp = localStorage.getItem("faketempState");
    if (savedFakeTemp !== null) {
        faketempCheckbox.checked = JSON.parse(savedFakeTemp);
    }

    faketempCheckbox.addEventListener("change", () => {
        localStorage.setItem("faketempState", JSON.stringify(faketempCheckbox.checked));
        p(faketempCheckbox.checked);
    });

    
    
    const activeZramButton = localStorage.getItem("activeZramButton");
    if (activeZramButton) {
        document.getElementById(activeZramButton).classList.add("active");
    }

    const zramButtons = document.querySelectorAll(".zram-button");
    zramButtons.forEach(button => {
        button.addEventListener("click", async () => {
            zramButtons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");
            localStorage.setItem("activeZramButton", button.id);
            if (button.id === "disableZramButton") {
                await disableZram();
            } else if (button.id === "configureZram8GBButton") {
                await configureZram(8);
            } else if (button.id === "configureZram24GBButton") {
                await configureZram(24);
            }
        });
    });

    // Обновление thermal trip point
    const thermalSlider = document.getElementById("thermalSlider");
    const thermalValue = document.getElementById("thermalValue");

    thermalSlider.addEventListener("input", async () => {
        const temp = thermalSlider.value;
        thermalValue.textContent = `${temp}°C`;
        await updateThermalTripPoint(temp);
    });

    let clickCount = 0;
    let resetTimer;
    const image = document.getElementById('image');
    const hiddenButton = document.getElementById('hiddenButton');
    const confirmationButtons = document.getElementById('confirmationButtons');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');

    if (image) {
        image.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 20) {
                hiddenButton.style.display = 'block'; 
            }
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
                clickCount = 0;
                hiddenButton.style.display = 'none'; 
            }, 3000);
        });
    }

    if (hiddenButton) {
        hiddenButton.addEventListener('click', () => {
            confirmationButtons.style.display = 'block';
            hiddenButton.style.display = 'none';
        });
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', async () => {
        });
    }
});

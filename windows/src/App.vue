<template>
  <div class="app-wrapper">
    <div class="login-glow"></div>
    <!-- Login View -->
    <div v-if="currentView === 'login'" class="login-view">
      <div class="login-card">
        <div class="login-logo">
          <img
            :src="juanrobotixLogo"
            alt="JuanRobotix Logo"
            class="glow-logo login-logo-img"
          />
          <h1>JUAN FLASHER</h1>
          <p class="subtitle">AVR Microcontroller Flashing Utility</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group-login">
            <label>EMAIL ADDRESS</label>
            <div class="input-wrapper-login">
              <span class="input-icon-login">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <input
                type="email"
                placeholder="email@example.com"
                v-model="loginEmail"
                :disabled="loginLoading"
                required
              />
            </div>
          </div>

          <div class="input-group-login">
            <label>PASSWORD</label>
            <div class="input-wrapper-login">
              <span class="input-icon-login">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                v-model="loginPassword"
                :disabled="loginLoading"
                required
                style="padding-right: 42px;"
              />
              <button
                type="button"
                class="password-toggle-btn"
                @click="showPassword = !showPassword"
                :disabled="loginLoading"
              >
                <svg
                  v-if="showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="loginError" class="login-error-msg">
            <span class="error-dot"></span>
            {{ loginError }}
          </div>

          <button type="submit" class="btn-login-submit" :disabled="loginLoading">
            <span v-if="loginLoading" class="spinner-inline"></span>
            <span v-else>SIGN IN</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Main Flasher App -->
    <div v-else class="app-container">
    <!-- Top Bar: Global Device Port -->
    <header class="global-port-section panel">
      <div class="port-header">
        <div class="header-titles">
          <div class="section-title">GLOBAL DEVICE PORT</div>
          <div class="section-subtitle">Unified port for all operations</div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span v-if="userEmail" class="user-badge">
            {{ userEmail }} {{ userRole ? `(${userRole.toUpperCase()})` : '' }}
          </span>
          <div
            class="refresh-icon"
            @click="refreshPorts"
            title="Refresh Ports"
            style="cursor: pointer; color: #00e676"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
              ></path>
            </svg>
          </div>
          <div
            class="signout-icon"
            @click="handleSignOut"
            title="Sign Out"
            style="cursor: pointer; color: #ff5252; display: flex; align-items: center;"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>

      <div class="port-controls">
        <div class="port-selector-wrapper">
          <!-- Utilizing the same class structure as the "Device Configuration" panel for consistency -->
          <div class="select-wrapper full-width">
            <span class="chip-icon" style="color: #7c4dff">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </span>
            <select class="custom-select" v-model="selectedPort">
              <option value="Select a port...">None / Select a port...</option>
              <option v-for="port in ports" :key="port.path" :value="port.path">
                {{ port.path }}
                {{ port.manufacturer ? `(${port.manufacturer})` : "" }}
              </option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
        </div>

        <div class="active-port-indicator">
          <div
            class="status-dot"
            :class="{
              active: selectedPort !== 'Select a port...' && isPortConnected,
              disconnected:
                selectedPort !== 'Select a port...' && !isPortConnected,
            }"
          ></div>
          <div class="status-text">
            <div class="label">
              {{
                selectedPort !== "Select a port..." && !isPortConnected
                  ? "DISCONNECTED"
                  : "ACTIVE PORT"
              }}
            </div>
            <div class="value">
              {{ selectedPort !== "Select a port..." ? selectedPort : "None" }}
            </div>
          </div>
        </div>
      </div>
      <div class="progress-bar-placeholder"></div>
    </header>

    <main class="main-grid">
      <!-- Left Column -->
      <div class="column left-col">
        <!-- Firmware Selection -->
        <section class="panel firmware-panel">
          <div class="panel-header">FIRMWARE SELECTION</div>
          <div class="panel-content">
            <!-- Source Toggle -->
            <div class="firmware-source-toggle">
              <button
                class="source-btn"
                :class="{ active: firmwareSource === 'local' }"
                @click="firmwareSource = 'local'; firmwarePath = ''; clearCloudCache()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                LOCAL
              </button>
              <button
                class="source-btn"
                :class="{ active: firmwareSource === 'cloud' }"
                @click="firmwareSource = 'cloud'; fetchCloudFirmware();"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
                CLOUD
              </button>
            </div>

            <!-- Local File Mode -->
            <div v-if="firmwareSource === 'local'">
              <label class="input-label">FIRMWARE FILE</label>
              <div class="file-input-group">
                <div class="file-input-wrapper">
                  <span class="upload-icon" style="color: #ffab00">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Select a .hex file..."
                    readonly
                    class="text-input-with-icon"
                    v-model="firmwarePath"
                  />
                </div>
                <button class="btn btn-secondary" @click="browseFirmware">
                  Browse
                </button>
              </div>
            </div>

            <!-- Cloud Mode -->
            <div v-if="firmwareSource === 'cloud'">
              <label class="input-label">CLOUD FIRMWARE</label>
              <div class="cloud-firmware-row">
                <div class="select-wrapper full-width">
                  <span class="chip-icon" style="color: #7c4dff">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
                  </span>
                  <select class="custom-select" v-model="selectedCloudFile" @change="onCloudFileSelected">
                    <option value="">Select firmware from cloud...</option>
                    <option v-for="file in cloudFirmwareFiles" :key="file.name" :value="file.name">
                      {{ file.name }} ({{ formatFileSize(file.metadata?.size || 0) }})
                    </option>
                  </select>
                  <div class="select-arrow">▼</div>
                </div>
                <button
                  class="btn-icon-tiny"
                  @click="fetchCloudFirmware"
                  title="Refresh"
                  style="color: var(--primary-color); margin-left: 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                </button>
              </div>
              <div v-if="cloudLoading" class="cloud-status-msg">
                <span class="spinner-inline"></span> Loading firmware list...
              </div>
              <div v-if="cloudDownloading" class="cloud-status-msg" style="margin-top: 6px;">
                <span class="spinner-inline"></span> Downloading firmware...
              </div>

              <!-- Admin: Upload + Delete -->
              <div v-if="userRole === 'admin'" class="cloud-admin-actions">
                <button class="btn btn-secondary btn-small" @click="triggerCloudUpload" :disabled="cloudUploading">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  {{ cloudUploading ? 'Uploading...' : 'Upload .hex' }}
                </button>
                <button
                  v-if="selectedCloudFile"
                  class="btn-table-action btn-delete btn-small"
                  @click="deleteCloudFirmware"
                  title="Delete selected firmware"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Delete
                </button>
                <input
                  type="file"
                  ref="cloudUploadInput"
                  accept=".hex"
                  style="display: none;"
                  @change="handleCloudUpload"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Primary Actions -->
        <section class="panel actions-panel">
          <div class="panel-header">PRIMARY ACTIONS</div>
          <div class="panel-content buttons-stack">
            <button
              class="btn btn-primary btn-large"
              @click="uploadFirmware"
              :disabled="isBusy"
            >
              <span class="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </span>
              {{ isBusy ? "Working..." : "Upload Firmware" }}
            </button>
            <button class="btn btn-danger btn-large" @click="stopOperation">
              <span class="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </span>
              Stop
            </button>
          </div>
        </section>
      </div>

      <!-- Right Column -->
      <div class="column right-col">
        <!-- System Status -->
        <section class="panel status-panel">
          <div class="panel-header">SYSTEM STATUS</div>
          <div class="panel-content status-row">
            <div class="status-icon-large success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="status-details">
              <div class="status-main success-text">READY</div>
              <div class="status-sub">No file selected</div>
            </div>
          </div>
        </section>

        <!-- ISP Programmer -->
        <section class="panel isp-panel">
          <div class="panel-header">ISP PROGRAMMER</div>
          <div class="panel-content">
            <label class="input-label">PROGRAMMER TYPE</label>
            <div class="select-wrapper mb-2">
              <span class="isp-icon" style="color: #e91e63">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  ></path>
                  <path
                    d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  ></path>
                </svg>
              </span>
              <select class="custom-select" v-model="selectedIsp">
                <option value="USBtinyISP">USBtinyISP</option>
                <option value="Arduino as ISP">Arduino as ISP</option>
                <option value="AVRISP mkII">AVRISP mkII</option>
              </select>
              <div class="select-arrow">▼</div>
            </div>

            <div class="isp-actions">
              <button
                class="btn btn-primary full-width mb-2"
                @click="ispUpload"
                :disabled="isBusy"
              >
                <span class="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </span>
                ISP Upload
              </button>
              <button
                class="btn btn-warning full-width mb-2"
                @click="burnBootloader"
                :disabled="isBusy"
              >
                <span class="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M8.56 2.9A7 7 0 0 1 19 9v4m-2 4H2a7 7 0 0 1 7-7v4l-3-3m0 0l3-3"
                    ></path>
                  </svg>
                </span>
                Burn Bootloader
              </button>
              <button
                class="btn btn-outline full-width"
                @click="testWiring"
                :disabled="isBusy"
              >
                <span class="icon">!</span>
                Test Wiring
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Bottom Panel (Tabs) -->
    <footer class="bottom-panel">
      <div class="panel-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'terminal' }"
          @click="activeTab = 'terminal'"
        >
          TERMINAL
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'serial' }"
          @click="activeTab = 'serial'"
        >
          SERIAL MONITOR
        </button>
        <button
          v-if="userRole === 'admin'"
          class="tab-btn"
          :class="{ active: activeTab === 'admin' }"
          @click="activeTab = 'admin'; fetchTempUsers();"
        >
          ADMIN CONTROL
        </button>

        <div class="tab-spacer"></div>

        <div class="terminal-controls">
          <label class="checkbox-label" v-if="activeTab === 'terminal'">
            <input type="checkbox" checked />
            Auto-scroll
          </label>
          <!-- Serial Controls (Mini) -->
          <div class="mini-serial-controls" v-if="activeTab === 'serial'">
            <label class="checkbox-label">
              <input type="checkbox" v-model="serialAutoscroll" />
              Auto-scroll
            </label>
            <button
              class="btn-icon-tiny"
              @click="clearSerialLogs"
              title="Clear Output"
              style="color: #ff0000"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18"></path>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
              </svg>
            </button>
            <div class="mini-select-group">
              <span class="label">BAUD</span>
              <select class="mini-select" v-model="serialBaud">
                <option value="300">300</option>
                <option value="600">600</option>
                <option value="1200">1200</option>
                <option value="2400">2400</option>
                <option value="4800">4800</option>
                <option value="9600">9600</option>
                <option value="14400">14400</option>
                <option value="19200">19200</option>
                <option value="28800">28800</option>
                <option value="38400">38400</option>
                <option value="57600">57600</option>
                <option value="74880">74880</option>
                <option value="115200">115200</option>
                <option value="230400">230400</option>
              </select>
            </div>
            <div class="mini-select-group">
              <span class="label">EOL</span>
              <select class="mini-select" v-model="serialEol">
                <option value="No Line Ending">No Line Ending</option>
                <option value="Newline">New Line</option>
                <option value="Carriage Return">Carriage Return</option>
                <option value="Both NL & CR">Both NL & CR</option>
              </select>
            </div>
            <button
              :class="serialConnected ? 'btn-mini-danger' : 'btn-mini-success'"
              @click="toggleSerial"
            >
              {{ serialConnected ? "Disconnect" : "Connect" }}
            </button>
          </div>

          <button
            class="btn-icon-tiny"
            @click="toggleTerminal"
            title="Toggle Terminal Height"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Terminal Tab Content -->
      <div
        class="panel-body terminal-body monospace"
        v-if="activeTab === 'terminal'"
      >
        <div class="log-line" v-for="(log, i) in logs" :key="i">
          {{ log }}
        </div>
      </div>

      <!-- Serial Tab Content -->
      <div class="panel-body serial-body" v-if="activeTab === 'serial'">
        <div class="serial-output monospace">
          <div v-for="(msg, i) in serialMessages" :key="i">{{ msg }}</div>
          <div class="placeholder-text" v-if="serialMessages.length === 0">
            No messages received...
          </div>
        </div>
        <div class="serial-input-bar">
          <span class="prompt-char">&gt;</span>
          <input
            type="text"
            class="text-input-noborder"
            placeholder="Send data to device..."
            v-model="serialInput"
            @keyup.enter="sendSerial"
          />
          <button class="btn-icon" @click="sendSerial">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <!-- Admin Tab Content -->
      <div class="panel-body admin-body" v-if="activeTab === 'admin' && userRole === 'admin'">
        <div class="admin-panel-grid">
          <!-- Generator Form -->
          <div class="admin-panel-section card-form">
            <h3 class="admin-sub-header">GENERATE TEMPORARY USER</h3>
            <form @submit.prevent="generateTempUser" class="admin-form">
              <div class="form-row">
                <div class="form-col">
                  <label class="input-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="operator@company.com"
                    v-model="tempEmailInput"
                    :disabled="generateLoading"
                    class="text-input"
                    required
                  />
                </div>
                <div class="form-col">
                  <label class="input-label">PASSWORD</label>
                  <input
                    type="text"
                    placeholder="Enter temp password"
                    v-model="tempPasswordInput"
                    :disabled="generateLoading"
                    class="text-input"
                    required
                  />
                </div>
              </div>
              <div class="form-row mt-2">
                <div class="form-col">
                  <label class="input-label">DURATION: {{ tempDurationHours }} {{ tempDurationHours === 1 ? 'HOUR' : 'HOURS' }}</label>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    step="1"
                    v-model="tempDurationHours"
                    :disabled="generateLoading"
                    class="range-slider"
                  />
                </div>
              </div>
              <div v-if="generateError" class="login-error-msg mt-2">
                <span class="error-dot"></span>
                {{ generateError }}
              </div>
              <div v-if="generateSuccess" class="admin-success-msg mt-2">
                <span class="success-dot"></span>
                {{ generateSuccess }}
              </div>
              <button type="submit" class="btn btn-primary mt-2" :disabled="generateLoading" style="width: 100%;">
                <span v-if="generateLoading" class="spinner-inline"></span>
                <span v-else>GENERATE ACCESS</span>
              </button>
            </form>
          </div>

          <!-- Active Temp Users List -->
          <div class="admin-panel-section card-list">
            <div class="list-header-row">
              <h3 class="admin-sub-header">ACTIVE TEMPORARY SESSIONS</h3>
              <button class="btn-icon-tiny" @click="fetchTempUsers" title="Refresh List" style="color: var(--primary-color);">
                Refresh
              </button>
            </div>
            <div class="temp-users-table-wrapper">
              <table class="temp-users-table">
                <thead>
                  <tr>
                    <th>EMAIL</th>
                    <th>EXPIRES AT</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in tempUsers" :key="user.id">
                    <td>{{ user.email }}</td>
                    <td>{{ new Date(user.expires_at).toLocaleString() }}</td>
                    <td>
                      <span class="status-tag" :class="new Date(user.expires_at).getTime() > Date.now() ? 'tag-active' : 'tag-expired'">
                        {{ new Date(user.expires_at).getTime() > Date.now() ? 'ACTIVE' : 'EXPIRED' }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <button
                        v-if="new Date(user.expires_at).getTime() > Date.now()"
                        class="btn-table-action btn-disable"
                        @click="disableTempUser(user.id, user.email)"
                        title="Disable (expire now)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                        Disable
                      </button>
                      <button
                        v-if="new Date(user.expires_at).getTime() <= Date.now()"
                        class="btn-table-action btn-renew"
                        @click="renewTempUser(user.id, user.email)"
                        title="Renew access"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                        Renew
                      </button>
                      <button
                        class="btn-table-action btn-delete"
                        @click="deleteTempUser(user.id, user.email)"
                        title="Delete permanently"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                  <tr v-if="tempUsers.length === 0">
                    <td colspan="4" class="text-center text-muted">No temporary sessions generated yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import juanrobotixLogo from "../assets/juanrobotix_logo.png";
import { supabase } from "./supabase";

// --- State ---
const currentView = ref<"login" | "dashboard">("login");
const userEmail = ref("");
const userRole = ref<"admin" | "temp" | "">("");
const userExpiresAt = ref<string | null>(null);

const loginEmail = ref("");
const loginPassword = ref("");
const loginError = ref("");
const loginLoading = ref(false);
const showPassword = ref(false);

// Admin Panel State
const tempEmailInput = ref("");
const tempPasswordInput = ref("");
const tempDurationHours = ref(2);
const generateError = ref("");
const generateSuccess = ref("");
const generateLoading = ref(false);
const tempUsers = ref<any[]>([]);

// Active session monitoring timer
let expirationCheckInterval: any = null;

const startExpirationCheck = () => {
  if (expirationCheckInterval) clearInterval(expirationCheckInterval);
  expirationCheckInterval = setInterval(async () => {
    if (userRole.value === 'temp' && userExpiresAt.value) {
      const expiresTime = new Date(userExpiresAt.value).getTime();
      if (Date.now() >= expiresTime) {
        addLog("Your temporary session has expired. Logging out...");
        await handleSignOut();
        alert("Session Expired: Your temporary account access has ended.");
      }
    }
  }, 5000);
};

const handleLogin = async () => {
  loginError.value = "";
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = "Please fill in all fields.";
    return;
  }
  
  loginLoading.value = true;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.value,
      password: loginPassword.value,
    });

    if (error) {
      loginError.value = error.message;
    } else if (data.user) {
      // Fetch profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, expires_at')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        addLog(`[Login Profile Error] ${profileError.message} (Code: ${profileError.code})`);
      }

      const expiresTime = profile?.expires_at ? new Date(profile.expires_at).getTime() : null;
      if (expiresTime && expiresTime < Date.now()) {
        loginError.value = "This temporary account has expired.";
        await supabase.auth.signOut();
        loginLoading.value = false;
        return;
      }

      userEmail.value = data.user.email || "";
      userRole.value = (profile?.role || "temp") as "admin" | "temp";
      userExpiresAt.value = profile?.expires_at || null;

      currentView.value = "dashboard";
      addLog(`Authenticated successfully as ${userEmail.value} (${userRole.value.toUpperCase()})`);
      if (userRole.value === 'temp' && userExpiresAt.value) {
        addLog(`Session expires on: ${new Date(userExpiresAt.value).toLocaleString()}`);
      }
      
      startExpirationCheck();
    }
  } catch (e: any) {
    loginError.value = e.message || "An unexpected error occurred.";
  } finally {
    loginLoading.value = false;
  }
};

const handleSignOut = async () => {
  if (expirationCheckInterval) {
    clearInterval(expirationCheckInterval);
    expirationCheckInterval = null;
  }
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Error signing out from Supabase:", e);
  }
  
  // Clear any downloaded cloud firmware on logout
  try {
    await window.electron.ipcRenderer.invoke("clear-firmware-cache");
  } catch (e) {
    console.error("Error clearing firmware cache:", e);
  }

  userEmail.value = "";
  userRole.value = "";
  userExpiresAt.value = null;
  currentView.value = "login";
  addLog("Logged out");
};

const fetchTempUsers = async () => {
  if (userRole.value !== 'admin') return;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'temp')
      .order('expires_at', { ascending: false });
    if (!error && data) {
      tempUsers.value = data;
    }
  } catch (e) {
    console.error("Error fetching temporary users:", e);
  }
};

const generateTempUser = async () => {
  generateError.value = "";
  generateSuccess.value = "";
  if (!tempEmailInput.value || !tempPasswordInput.value) {
    generateError.value = "Please fill in all fields.";
    return;
  }

  generateLoading.value = true;
  try {
    const { data, error } = await supabase.rpc('create_temp_user', {
      p_email: tempEmailInput.value,
      p_password: tempPasswordInput.value,
      p_duration_hours: Number(tempDurationHours.value),
    });

    if (error) {
      generateError.value = error.message || "Failed to create temporary user.";
    } else if (data && data.error) {
      generateError.value = data.error;
    } else {
      generateSuccess.value = `Successfully created temporary user: ${tempEmailInput.value}!`;
      addLog(`Admin generated temporary session for: ${tempEmailInput.value}`);
      tempEmailInput.value = "";
      tempPasswordInput.value = "";
      await fetchTempUsers();
    }
  } catch (e: any) {
    generateError.value = e.message || "An unexpected error occurred.";
  } finally {
    generateLoading.value = false;
  }
};

const disableTempUser = async (userId: string, email: string) => {
  if (!confirm(`Disable temporary user "${email}"? Their session will expire immediately.`)) return;
  try {
    const { error } = await supabase.rpc('disable_temp_user', { p_user_id: userId });
    if (error) {
      addLog(`[Admin Error] Failed to disable ${email}: ${error.message}`);
    } else {
      addLog(`Admin disabled temporary user: ${email}`);
      await fetchTempUsers();
    }
  } catch (e: any) {
    addLog(`[Admin Error] ${e.message}`);
  }
};

const renewTempUser = async (userId: string, email: string) => {
  const duration = tempDurationHours.value;
  if (!confirm(`Renew "${email}" for ${duration} hour(s) from now?`)) return;
  try {
    const { error } = await supabase.rpc('renew_temp_user', { p_user_id: userId, p_duration_hours: duration });
    if (error) {
      addLog(`[Admin Error] Failed to renew ${email}: ${error.message}`);
    } else {
      addLog(`Admin renewed temporary user: ${email} for ${duration} hour(s)`);
      await fetchTempUsers();
    }
  } catch (e: any) {
    addLog(`[Admin Error] ${e.message}`);
  }
};

const deleteTempUser = async (userId: string, email: string) => {
  if (!confirm(`Permanently delete temporary user "${email}"? This cannot be undone.`)) return;
  try {
    const { error } = await supabase.rpc('delete_temp_user', { p_user_id: userId });
    if (error) {
      addLog(`[Admin Error] Failed to delete ${email}: ${error.message}`);
    } else {
      addLog(`Admin deleted temporary user: ${email}`);
      await fetchTempUsers();
    }
  } catch (e: any) {
    addLog(`[Admin Error] ${e.message}`);
  }
};

const activeTab = ref("terminal");
const isTerminalExpanded = ref(false);
const ports = ref<{ path: string; manufacturer?: string }[]>([]);
const selectedPort = ref("Select a port...");
const firmwarePath = ref("");
const selectedMcu = ref("m328p"); // Default to m328p
const selectedIsp = ref("Arduino as ISP");
const logs = ref<string[]>([]);
const isBusy = ref(false);

// Cloud Firmware State
const firmwareSource = ref<"local" | "cloud">("local");
const cloudFirmwareFiles = ref<any[]>([]);
const selectedCloudFile = ref("");
const cloudLoading = ref(false);
const cloudDownloading = ref(false);
const cloudUploading = ref(false);
const cloudUploadInput = ref<HTMLInputElement | null>(null);

const FIRMWARE_BUCKET = "firmware";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const fetchCloudFirmware = async () => {
  cloudLoading.value = true;
  try {
    const { data, error } = await supabase.storage
      .from(FIRMWARE_BUCKET)
      .list("", { sortBy: { column: "name", order: "asc" } });
    if (error) {
      addLog(`[Cloud Error] ${error.message}`);
    } else {
      // Filter only .hex files
      cloudFirmwareFiles.value = (data || []).filter((f: any) => f.name.endsWith(".hex"));
      addLog(`Loaded ${cloudFirmwareFiles.value.length} firmware file(s) from cloud`);
    }
  } catch (e: any) {
    addLog(`[Cloud Error] ${e.message}`);
  } finally {
    cloudLoading.value = false;
  }
};

const onCloudFileSelected = async () => {
  if (!selectedCloudFile.value) {
    firmwarePath.value = "";
    return;
  }

  cloudDownloading.value = true;
  addLog(`Downloading cloud firmware: ${selectedCloudFile.value}...`);
  try {
    const { data, error } = await supabase.storage
      .from(FIRMWARE_BUCKET)
      .download(selectedCloudFile.value);

    if (error) {
      addLog(`[Cloud Error] Download failed: ${error.message}`);
      cloudDownloading.value = false;
      return;
    }

    // Convert blob to base64 and send to Electron to save as temp file
    const arrayBuffer = await data.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce((d, byte) => d + String.fromCharCode(byte), "")
    );

    const localPath = await window.electron.ipcRenderer.invoke("save-cloud-firmware", {
      fileName: selectedCloudFile.value,
      base64Data,
    });

    firmwarePath.value = localPath;
    addLog(`Cloud firmware ready: ${localPath}`);
  } catch (e: any) {
    addLog(`[Cloud Error] ${e.message}`);
  } finally {
    cloudDownloading.value = false;
  }
};

const clearCloudCache = async () => {
  try {
    await window.electron.ipcRenderer.invoke("clear-firmware-cache");
  } catch (e) {
    console.error("Error clearing firmware cache:", e);
  }
};

const triggerCloudUpload = () => {
  cloudUploadInput.value?.click();
};

const handleCloudUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;

  if (!file.name.endsWith(".hex")) {
    addLog("[Cloud Error] Only .hex files are allowed.");
    return;
  }

  cloudUploading.value = true;
  addLog(`Uploading ${file.name} to cloud storage...`);
  try {
    const { error } = await supabase.storage
      .from(FIRMWARE_BUCKET)
      .upload(file.name, file, { upsert: true });

    if (error) {
      addLog(`[Cloud Error] Upload failed: ${error.message}`);
    } else {
      addLog(`Successfully uploaded: ${file.name}`);
      await fetchCloudFirmware();
    }
  } catch (e: any) {
    addLog(`[Cloud Error] ${e.message}`);
  } finally {
    cloudUploading.value = false;
    // Reset input so same file can be re-uploaded
    if (input) input.value = "";
  }
};

const deleteCloudFirmware = async () => {
  if (!selectedCloudFile.value) return;
  if (!confirm(`Delete "${selectedCloudFile.value}" from cloud storage? This cannot be undone.`)) return;

  try {
    const { error } = await supabase.storage
      .from(FIRMWARE_BUCKET)
      .remove([selectedCloudFile.value]);

    if (error) {
      addLog(`[Cloud Error] Delete failed: ${error.message}`);
    } else {
      addLog(`Deleted cloud firmware: ${selectedCloudFile.value}`);
      selectedCloudFile.value = "";
      firmwarePath.value = "";
      await fetchCloudFirmware();
    }
  } catch (e: any) {
    addLog(`[Cloud Error] ${e.message}`);
  }
};

// Serial Monitor State
const serialBaud = ref("115200");
const serialEol = ref("Newline"); // 'Newline', 'No Line Ending'
const serialConnected = ref(false);
const serialAutoscroll = ref(true);
const serialMessages = ref<string[]>([]);
const serialInput = ref("");

// Port Connection State
const isPortConnected = ref(true);

// Buffer for avrdude logs to handle progress bars

// --- lifecycle ---
onMounted(async () => {
  // Clear any leftover downloaded cloud firmware when the app starts
  try {
    await window.electron.ipcRenderer.invoke("clear-firmware-cache");
  } catch (e) {
    console.error("Error clearing firmware cache on startup:", e);
  }

  // Check active user session on load
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, expires_at')
        .eq('id', data.session.user.id)
        .single();
      
      if (profileError) {
        addLog(`[Session Profile Error] ${profileError.message} (Code: ${profileError.code})`);
      }
      
      const expiresTime = profile?.expires_at ? new Date(profile.expires_at).getTime() : null;
      if (expiresTime && expiresTime < Date.now()) {
        // Expired
        await supabase.auth.signOut();
        addLog("Previous temporary session has expired.");
      } else {
        userEmail.value = data.session.user.email || "";
        userRole.value = (profile?.role || "temp") as "admin" | "temp";
        userExpiresAt.value = profile?.expires_at || null;

        currentView.value = "dashboard";
        addLog(`Restored session for ${userEmail.value} (${userRole.value.toUpperCase()})`);
        if (userRole.value === 'temp' && userExpiresAt.value) {
          addLog(`Session expires on: ${new Date(userExpiresAt.value).toLocaleString()}`);
        }
        
        startExpirationCheck();
      }
    }
  } catch (e) {
    console.error("Failed to restore Supabase session:", e);
  }

  // Initial logs
  addLog("Juan Flasher v3.2.2 initialized");
  addLog("System ready");
  addLog("Waiting for command...");

  // Load ports
  await refreshPorts();

  // Listen for avrdude logs with buffering support
  window.electron.ipcRenderer.on(
    "avrdude-log",
    (_event: any, message: string) => {
      // Append to buffer
      // If message contains line breaks or is a progress update, handle accordingly
      handleAvrdudeLog(message);
    },
  );

  // Listen for Serial Data
  // Listen for Serial Data
  window.electron.ipcRenderer.on("serial-data", (_e: any, data: string) => {
    // Basic buffering: Append incoming data to the last line if no newline,
    // or split and push if newlines are present.
    // Also strip \r to avoid artifacts, assuming \n is primary separator
    const safeData = data.replace(/\r/g, "");

    // If we have no lines yet, add one
    if (serialMessages.value.length === 0) {
      serialMessages.value.push("");
    }

    const parts = safeData.split("\n");

    // The first part always belongs to the *current* last line
    const lastIdx = serialMessages.value.length - 1;
    serialMessages.value[lastIdx] += parts[0];

    // Any subsequent parts are new lines
    for (let i = 1; i < parts.length; i++) {
      serialMessages.value.push(parts[i]);
    }

    scrollToBottomSerial();
  });

  window.electron.ipcRenderer.on("serial-error", (_e: any, msg: string) => {
    addLog(`[SERIAL ERROR] ${msg}`);
    serialConnected.value = false;
  });

  window.electron.ipcRenderer.on("serial-closed", () => {
    addLog(`[SERIAL] Port closed`);
    serialConnected.value = false;
  });

  // Periodic port availability check (every 2 seconds)
  setInterval(async () => {
    if (selectedPort.value !== "Select a port...") {
      await refreshPorts();
      // Check if selected port still exists in the ports list
      const portExists = ports.value.some((p) => p.path === selectedPort.value);
      isPortConnected.value = portExists;
    } else {
      isPortConnected.value = true; // No port selected, so set to default
    }
  }, 2000);
});

// --- Actions ---

/**
 * Handles incoming log chunks from avrdude.
 * Reconstructs lines and updates the UI for progress bars.
 */
const handleAvrdudeLog = (msg: string) => {
  if (!msg) return;

  const parts = msg.split("\n");

  parts.forEach((part) => {
    // Skip empty chunks if we have multiple (avoids double spacing from split)
    if (!part && parts.length > 1) return;
    if (!part) return;

    const trimmed = part.trim();
    // Detect if this part acts as a "Header" or start of a new progress block
    const isNewHeader =
      trimmed.startsWith("Reading |") ||
      trimmed.startsWith("Writing |") ||
      trimmed.startsWith("Verifying |");

    // Detect if this part is a progress update (has # or %) AND is NOT a new header
    const isProgressUpdate =
      !isNewHeader && (trimmed.includes("#") || trimmed.includes("%"));

    if (isProgressUpdate) {
      const lastLogIndex = logs.value.length - 1;
      if (lastLogIndex >= 0) {
        const lastLog = logs.value[lastLogIndex];
        // Only append if the last line matches a progress bar pattern
        // (Starts with expected headers or contains #)
        if (
          lastLog.includes("Reading |") ||
          lastLog.includes("Writing |") ||
          lastLog.includes("Verifying |") ||
          lastLog.includes("#")
        ) {
          logs.value[lastLogIndex] = lastLog + part;
          scrollToBottomTerminal();
          return;
        }
      }
    }

    // Otherwise, push as a new line
    logs.value.push(`> ${part}`);
  });

  scrollToBottomTerminal();
};

const addLog = (msg: string) => {
  if (!msg || !msg.trim()) return;
  logs.value.push(`> ${msg.trim()}`);
  scrollToBottomTerminal();
};

const toggleTerminal = () => {
  isTerminalExpanded.value = !isTerminalExpanded.value;
};

const clearSerialLogs = () => {
  serialMessages.value = [];
};

const scrollToBottomTerminal = () => {
  nextTick(() => {
    const container = document.querySelector(".terminal-body");
    if (container) container.scrollTop = container.scrollHeight;
  });
};

const scrollToBottomSerial = () => {
  if (!serialAutoscroll.value) return; // Respect autoscroll setting
  nextTick(() => {
    const container = document.querySelector(".serial-output");
    if (container) container.scrollTop = container.scrollHeight;
  });
};

const refreshPorts = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke("list-ports");
    ports.value = result;
    // Auto-select first if available and none selected
    if (ports.value.length > 0 && selectedPort.value === "Select a port...") {
      selectedPort.value = ports.value[0].path;
    }
  } catch (err) {
    addLog(`Error listing ports: ${err}`);
  }
};

const browseFirmware = async () => {
  try {
    const path = await window.electron.ipcRenderer.invoke("dialog:open-file");
    if (path) {
      firmwarePath.value = path;
      addLog(`Selected firmware: ${path}`);
    }
  } catch (err: any) {
    addLog(`Error opening file dialog: ${err.message}`);
  }
};

// 1. Upload Firmware
const uploadFirmware = async () => {
  if (isBusy.value) return;
  if (selectedPort.value === "Select a port...") {
    addLog("Error: No port selected");
    return;
  }
  if (!firmwarePath.value) {
    addLog("Error: No firmware file selected");
    return;
  }

  activeTab.value = "terminal";
  isBusy.value = true;
  addLog(`Starting Firmware Upload to ${selectedPort.value}...`);
  try {
    await window.electron.ipcRenderer.invoke("upload-firmware", {
      port: selectedPort.value,
      hexPath: firmwarePath.value,
      mcu: selectedMcu.value,
      baud: "115200",
    });
    addLog("Upload Complete!");
  } catch (e: any) {
    addLog(`Upload Failed: ${e.message}`);
  } finally {
    isBusy.value = false;
  }
};

// 2. Stop
const stopOperation = async () => {
  await window.electron.ipcRenderer.invoke("stop-operation");
  addLog("Operation stopped by user.");
  isBusy.value = false;
};

// 3. ISP Upload
const ispUpload = async () => {
  if (isBusy.value) return;
  if (!firmwarePath.value) {
    addLog("Error: No firmware file selected");
    return;
  }
  activeTab.value = "terminal";
  isBusy.value = true;
  addLog(`Starting ISP Upload using ${selectedIsp.value}...`);
  try {
    await window.electron.ipcRenderer.invoke("isp-upload", {
      programmer: selectedIsp.value,
      hexPath: firmwarePath.value,
      mcu: selectedMcu.value,
      port: selectedPort.value,
    });
    addLog("ISP Upload Complete!");
  } catch (e: any) {
    addLog(`ISP Upload Failed: ${e.message}`);
  } finally {
    isBusy.value = false;
  }
};

// 4. Burn Bootloader
const burnBootloader = async () => {
  if (isBusy.value) return;
  activeTab.value = "terminal";
  isBusy.value = true;
  addLog(`Burning Bootloader for ${selectedMcu.value}...`);
  try {
    await window.electron.ipcRenderer.invoke("burn-bootloader", {
      programmer: selectedIsp.value,
      mcu: selectedMcu.value,
      port: selectedPort.value,
    });
    addLog("Bootloader Burn Complete!");
  } catch (e: any) {
    addLog(`Burn Failed: ${e.message}`);
  } finally {
    isBusy.value = false;
  }
};

// 5. Test Wiring
const testWiring = async () => {
  if (isBusy.value) return;
  activeTab.value = "terminal";
  isBusy.value = true;
  addLog("Testing Wiring...");
  try {
    await window.electron.ipcRenderer.invoke("test-wiring", {
      programmer: selectedIsp.value,
      mcu: selectedMcu.value,
      port: selectedPort.value,
    });
    addLog("Wiring Test Success! (Avrdude connected)");
  } catch (e: any) {
    addLog(`Wiring Test Failed: ${e.message}`);
  } finally {
    isBusy.value = false;
  }
};

// 6. Serial Monitor Connect
const toggleSerial = async () => {
  if (serialConnected.value) {
    await window.electron.ipcRenderer.invoke("serial-disconnect");
    // State updated by event
  } else {
    if (selectedPort.value === "Select a port...") {
      addLog("Select a port first!");
      return;
    }
    addLog(`Connecting Serial to ${selectedPort.value}...`);
    clearSerialLogs(); // Auto-clear on connect
    const success = await window.electron.ipcRenderer.invoke("serial-connect", {
      port: selectedPort.value,
      baud: serialBaud.value,
    });
    if (success) {
      serialConnected.value = true;
      addLog("Serial Connected.");
    } else {
      addLog("Serial Connection Failed.");
    }
  }
};

const sendSerial = async () => {
  if (!serialConnected.value || !serialInput.value) return;

  let textToSend = serialInput.value;
  switch (serialEol.value) {
    case "Newline":
      textToSend += "\n";
      break;
    case "Carriage Return":
      textToSend += "\r";
      break;
    case "Both NL & CR":
      textToSend += "\r\n";
      break;
    case "No Line Ending":
    default:
      // No appending
      break;
  }

  await window.electron.ipcRenderer.invoke("serial-write", textToSend);
  // Echo local?
  serialMessages.value.push(`[TX] ${textToSend.trim()}`);
  serialInput.value = "";
  scrollToBottomSerial();
};
</script>

<style>
/* --- Design System --- */
:root {
  --bg-dark: #1a1a1a;
  --bg-panel: #242424;
  --bg-input: #111111;
  --primary-color: #00bcd4; /* Cyan/Teal */
  --primary-hover: #00acc1;
  --warning-color: #ff9800; /* Orange */
  --warning-hover: #f57c00;
  --danger-color: #f44336; /* Red */
  --danger-hover: #d32f2f;
  --success-color: #4caf50; /* Green */
  --text-main: #ffffff;
  --text-muted: #aaaaaa;
  --border-color: #333333;
}

/* --- Layout --- */
.app-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #0c0c0e;
  overflow: hidden;
}

.app-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: transparent;
  color: #fff;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
  flex: 0 1 auto; /* Allow shrinking/fitting, don't greedily take all space if bottom panel wants it */
  overflow-y: auto;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column .panel:last-child {
  flex: 1;
}

/* --- Global Port Bar --- */
.global-port-section {
  background: rgba(30, 30, 35, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 20px 16px;
  border-bottom: 4px solid var(--warning-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05);
  z-index: 10;
}

.port-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header-titles .section-title {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.header-titles .section-subtitle {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.port-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.port-selector-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background-color: rgba(10, 10, 12, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}

/* Removed .port-selector-wrapper .usb-icon and .port-select as we reused the standard classes */

.active-port-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 120px;
  background: rgba(255, 255, 255, 0.01);
  border-radius: 6px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #666;
  transition: all 0.3s ease;
}

.status-dot.active {
  background-color: var(--success-color);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }
  50% {
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
  }
}

.status-dot.disconnected {
  background-color: var(--danger-color);
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
  }
  50% {
    box-shadow: 0 0 12px rgba(244, 67, 54, 0.8);
  }
}

.status-text .label {
  font-size: 0.65rem;
  color: var(--primary-color);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-text .value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}

/* --- Common Panel Styles --- */
.panel {
  background: rgba(30, 30, 35, 0.45);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

.panel-header {
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.02);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-content {
  padding: 12px;
}

/* --- Form Elements --- */
.input-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.text-input,
.custom-select {
  background-color: rgba(10, 10, 12, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.9rem;
  outline: none;
  width: 100%;
  transition: all 0.3s ease;
}

.text-input:focus,
.custom-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 10px rgba(0, 188, 212, 0.2);
  background-color: rgba(10, 10, 12, 0.95);
}

.custom-select {
  appearance: none;
  cursor: pointer;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-arrow {
  position: absolute;
  right: 12px;
  color: #666;
  pointer-events: none;
  font-size: 0.7rem;
}

.chip-icon,
.isp-icon {
  position: absolute;
  left: 10px;
  color: var(--primary-color);
  pointer-events: none;
  z-index: 1;
}

.select-wrapper select {
  padding-left: 36px;
}

/* --- Specific Components --- */
.file-input-group {
  display: flex;
  gap: 8px;
}

.file-input-wrapper {
  position: relative;
  flex: 1;
}

.file-input-wrapper .upload-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.text-input-with-icon {
  width: 100%;
  padding: 8px 8px 8px 36px;
  background-color: rgba(10, 10, 12, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: white;
  outline: none;
  transition: all 0.3s ease;
}

.text-input-with-icon:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 10px rgba(0, 188, 212, 0.2);
  background-color: rgba(10, 10, 12, 0.95);
}

/* --- Buttons --- */
.btn {
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.25);
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #00acc1 0%, #0097a7 100%);
  box-shadow: 0 6px 16px rgba(0, 188, 212, 0.35);
  transform: translateY(-1px);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(0, 188, 212, 0.15);
}

.btn-secondary {
  background-color: transparent;
  border: 1px solid rgba(0, 188, 212, 0.3);
  color: #00bcd4;
}
.btn-secondary:hover:not(:disabled) {
  background-color: rgba(0, 188, 212, 0.08);
  border-color: #00bcd4;
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.25);
}
.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  box-shadow: 0 6px 16px rgba(244, 67, 54, 0.35);
  transform: translateY(-1px);
}
.btn-danger:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);
}
.btn-warning:hover:not(:disabled) {
  background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.35);
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #aaaaaa;
}
.btn-outline:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background-color: rgba(0, 188, 212, 0.02);
}

.btn-large {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
}

.buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* --- Left Column specific adjustments --- */
.firmware-panel,
.device-panel,
.actions-panel {
  /* Match screenshot structure */
}

/* --- Right Column specific adjustments --- */
.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-icon-large {
  color: #4caf50;
}
.success-text {
  color: #4caf50;
  font-weight: 700;
  font-size: 1.1rem;
}
.status-sub {
  font-size: 0.8rem;
  color: #888;
}

.full-width {
  width: 100%;
}
.mb-2 {
  margin-bottom: 8px;
}

/* --- Bottom Panel (Tabbed) --- */
.bottom-panel {
  background: rgba(18, 18, 22, 0.8);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  flex: 1; /* 1 1 0% - strictly fill space, do not grow with content */
  min-height: 200px;
  overflow: hidden; /* Constrain children */
  flex-shrink: 0;
  transition: min-height 0.3s ease;
}

.bottom-panel.expanded {
  min-height: 600px;
}

.panel-tabs {
  display: flex;
  align-items: center;
  background-color: rgba(30, 30, 35, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #888;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  text-transform: uppercase;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ccc;
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-spacer {
  flex: 1;
}

.terminal-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #888;
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.terminal-body {
  width: 100%; /* Ensure it spans the full width */
  padding: 8px 12px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.85rem;
  color: #ff5252;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-line {
  color: #ff5252;
}
.prompt {
  margin-right: 6px;
  opacity: 0.7;
}

/* Serial Tab Styles */
.serial-body {
  background-color: rgba(10, 10, 12, 0.4);
}

.serial-output {
  flex: 1;
  width: 100%; /* Ensure it spans the full width */
  padding: 8px 12px;
  overflow-y: auto;
  font-size: 0.85rem;
  color: #4caf50;
  white-space: pre-wrap; /* Respect newlines and spaces */
  word-break: break-all; /* Break long words if necessary */
}

.serial-input-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(20, 20, 25, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.prompt-char {
  color: var(--primary-color);
  margin-right: 8px;
  font-weight: bold;
}

.text-input-noborder {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  outline: none;
  font-family: monospace;
}

.btn-icon {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}
.btn-icon:hover {
  color: var(--primary-color);
}

/* Mini Serial Controls (in Header) */
.mini-serial-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-select-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
}
.mini-select-group .label {
  color: var(--primary-color);
  font-weight: 600;
}

.mini-select {
  background: #111;
  border: 1px solid #333;
  color: #ccc;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 0.7rem;
  outline: none;
}

.btn-mini-primary {
  padding: 2px 8px;
  font-size: 0.7rem;
  background: var(--primary-color);
  color: #000;
  border: none;
  border-radius: 2px;
  font-weight: 600;
  cursor: pointer;
}
.btn-mini-primary:hover {
  background: var(--primary-hover);
}

.btn-mini-success {
  padding: 2px 8px;
  font-size: 0.7rem;
  background: var(--success-color);
  color: #fff;
  border: none;
  border-radius: 2px;
  font-weight: 600;
  cursor: pointer;
}
.btn-mini-success:hover {
  background: #43a047;
}

.btn-mini-danger {
  padding: 2px 8px;
  font-size: 0.7rem;
  background: var(--danger-color);
  color: #fff;
  border: none;
  border-radius: 2px;
  font-weight: 600;
  cursor: pointer;
}
.btn-mini-danger:hover {
  background: var(--danger-hover);
}

.btn-icon-tiny {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 2px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #1a1a1a;
}
::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* --- Login Page Styles --- */
.login-view {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: transparent;
  overflow: hidden;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #ffffff;
}

.login-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 188, 212, 0.15) 0%, rgba(124, 77, 255, 0.05) 50%, transparent 100%);
  filter: blur(80px);
  z-index: 1;
  pointer-events: none;
  animation: pulse-glow 8s infinite alternate;
}

@keyframes pulse-glow {
  0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
  100% { transform: scale(1.2) translate(20px, -20px); opacity: 1; }
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: rgba(30, 30, 35, 0.45);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  text-align: center;
}

.login-logo {
  margin-bottom: 30px;
}

.glow-logo {
  filter: drop-shadow(0 0 8px rgba(0, 188, 212, 0.5));
  margin-bottom: 12px;
}

.login-logo-img {
  height: 64px;
  max-width: 100%;
  object-fit: contain;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 12px rgba(0, 188, 212, 0.4));
}

.login-logo h1 {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #00ffff 0%, #7c4dff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 6px 0;
}

.login-logo .subtitle {
  color: #888899;
  font-size: 0.85rem;
  letter-spacing: 1px;
  margin: 0;
  text-transform: uppercase;
}

.login-form {
  text-align: left;
}

.input-group-login {
  margin-bottom: 20px;
}

.input-group-login label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #888899;
  margin-bottom: 8px;
  letter-spacing: 1.5px;
}

.input-wrapper-login {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon-login {
  position: absolute;
  left: 14px;
  color: #555566;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.input-wrapper-login input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background-color: rgba(10, 10, 12, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.input-wrapper-login input:focus {
  outline: none;
  border-color: #00bcd4;
  box-shadow: 0 0 12px rgba(0, 188, 212, 0.25);
  background-color: rgba(10, 10, 12, 0.95);
}

.input-wrapper-login input:focus + .input-icon-login {
  color: #00bcd4;
}

.login-error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  color: #ff5252;
  font-size: 0.85rem;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.error-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ff5252;
  box-shadow: 0 0 6px #ff5252;
}

.btn-login-submit {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.3);
}

.btn-login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #00acc1 0%, #0097a7 100%);
  box-shadow: 0 6px 20px rgba(0, 188, 212, 0.45);
}

.btn-login-submit:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 188, 212, 0.2);
}

.btn-login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider-login {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #444455;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.divider-login::before,
.divider-login::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.divider-login span {
  padding: 0 10px;
}

.btn-login-bypass {
  width: 100%;
  padding: 12px;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #aaaaaa;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login-bypass:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.02);
}

.btn-login-bypass:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  font-size: 0.75rem;
  color: #555566;
}

.spinner-inline {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-badge {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  color: #aaaaaa;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.password-toggle-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #555566;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.3s ease;
}

.password-toggle-btn:hover {
  color: var(--primary-color);
}

/* --- Admin Panel Styles --- */
.admin-body {
  padding: 16px;
  overflow-y: auto;
}

.admin-panel-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 16px;
  height: 100%;
}

.admin-panel-section {
  background: rgba(30, 30, 35, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.admin-sub-header {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mt-2 {
  margin-top: 8px;
}

.range-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  margin: 10px 0;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 188, 212, 0.6);
  transition: transform 0.1s;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.admin-success-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.2);
  color: var(--success-color);
  font-size: 0.85rem;
  padding: 10px 12px;
  border-radius: 6px;
}

.success-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--success-color);
  box-shadow: 0 0 6px var(--success-color);
}

.list-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.temp-users-table-wrapper {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
}

.temp-users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  text-align: left;
}

.temp-users-table th,
.temp-users-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.temp-users-table th {
  background-color: rgba(255, 255, 255, 0.02);
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.temp-users-table tr:hover {
  background-color: rgba(255, 255, 255, 0.01);
}

.text-center {
  text-align: center;
}

.status-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-active {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.tag-expired {
  background-color: rgba(244, 67, 54, 0.1);
  color: #ff5252;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-table-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-disable {
  color: #ffab00;
  border-color: rgba(255, 171, 0, 0.3);
}

.btn-disable:hover {
  background-color: rgba(255, 171, 0, 0.1);
  box-shadow: 0 0 8px rgba(255, 171, 0, 0.2);
}

.btn-renew {
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.3);
}

.btn-renew:hover {
  background-color: rgba(76, 175, 80, 0.1);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.2);
}

.btn-delete {
  color: #ff5252;
  border-color: rgba(244, 67, 54, 0.3);
}

.btn-delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.2);
}

/* --- Cloud Firmware Styles --- */
.firmware-source-toggle {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  overflow: hidden;
}

.source-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-btn:hover {
  color: var(--text-secondary);
  background-color: rgba(255, 255, 255, 0.03);
}

.source-btn.active {
  color: var(--primary-color);
  background-color: rgba(0, 188, 212, 0.08);
  box-shadow: inset 0 -2px 0 var(--primary-color);
}

.cloud-firmware-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cloud-status-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 8px;
}

.cloud-admin-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}

.btn-small {
  padding: 4px 10px;
  font-size: 0.7rem;
}
</style>

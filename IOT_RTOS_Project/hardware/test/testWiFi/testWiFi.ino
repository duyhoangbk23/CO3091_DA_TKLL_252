#include <WiFi.h>

// ============================================
// WiFi Test Configuration
// ============================================
// TODO: Thay đổi thông tin WiFi của bạn tại đây
const char* WIFI_SSID = "Z Robotics";        // Tên WiFi
const char* WIFI_PASS = "28102023";    // Mật khẩu WiFi

// ============================================
// Global Variables
// ============================================
unsigned long lastTestTime = 0;
const unsigned long TEST_INTERVAL = 10000;  // Test mỗi 10 giây
bool wifiConnected = false;

// ============================================
// Setup
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("   WiFi Connection Test for ESP32");
  Serial.println("========================================\n");
  
  printESP32Info();
  
  Serial.println("\n--- Bắt đầu Scan WiFi Networks ---");
  scanWiFiNetworks();
  
  Serial.println("\n--- Thử kết nối WiFi ---");
  Serial.printf("SSID: %s\n", WIFI_SSID);
  Serial.printf("Password: %s\n", WIFI_PASS);
  
  connectToWiFi();
}

// ============================================
// Loop - Kiểm tra kết nối liên tục
// ============================================
void loop() {
  unsigned long currentTime = millis();
  
  // Kiểm tra trạng thái WiFi mỗi 10 giây
  if (currentTime - lastTestTime >= TEST_INTERVAL) {
    lastTestTime = currentTime;
    testWiFiConnection();
  }
  
  // Nếu WiFi bị ngắt, thử kết nối lại
  if (WiFi.status() != WL_CONNECTED && wifiConnected) {
    Serial.println("\n[!] WiFi disconnected! Reconnecting...");
    wifiConnected = false;
    connectToWiFi();
  }
  
  delay(100);
}

// ============================================
// Function: In thông tin ESP32
// ============================================
void printESP32Info() {
  Serial.println("--- ESP32 System Information ---");
  Serial.printf("Chip Model: %s\n", ESP.getChipModel());
  Serial.printf("Chip Revision: %d\n", ESP.getChipRevision());
  Serial.printf("Cores: %d\n", ESP.getChipCores());
  Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("MAC Address: %s\n", WiFi.macAddress().c_str());
  Serial.printf("Flash Chip Size: %d bytes\n\n", ESP.getFlashChipSize());
}

// ============================================
// Function: Scan WiFi Networks
// ============================================
void scanWiFiNetworks() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  int n = WiFi.scanNetworks();
  
  if (n == 0) {
    Serial.println("Không tìm thấy WiFi network nào!");
  } else {
    Serial.printf("Tìm thấy %d WiFi network:\n", n);
    for (int i = 0; i < n; ++i) {
      Serial.printf("  %d. %s (RSSI: %d dBm, Channel: %d, Security: %s)\n",
                    i + 1,
                    WiFi.SSID(i).c_str(),
                    WiFi.RSSI(i),
                    WiFi.channel(i),
                    getSecurityType(WiFi.encryptionType(i)));
      delay(100);
    }
  }
  WiFi.scanDelete();
}

// ============================================
// Function: Lấy loại bảo mật WiFi
// ============================================
const char* getSecurityType(uint8_t type) {
  switch (type) {
    case WIFI_AUTH_OPEN:
      return "Open";
    case WIFI_AUTH_WEP:
      return "WEP";
    case WIFI_AUTH_WPA_PSK:
      return "WPA_PSK";
    case WIFI_AUTH_WPA2_PSK:
      return "WPA2_PSK";
    case WIFI_AUTH_WPA_WPA2_PSK:
      return "WPA/WPA2_PSK";
    case WIFI_AUTH_WPA2_ENTERPRISE:
      return "WPA2_ENTERPRISE";
    case WIFI_AUTH_WPA3_PSK:
      return "WPA3_PSK";
    case WIFI_AUTH_WPA2_WPA3_PSK:
      return "WPA2/WPA3_PSK";
    default:
      return "Unknown";
  }
}

// ============================================
// Function: Kết nối WiFi
// ============================================
void connectToWiFi() {
  Serial.println("\nKết nối WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int attemptCount = 0;
  int maxAttempts = 20;  // Thử 20 lần x 500ms = 10 giây
  
  while (WiFi.status() != WL_CONNECTED && attemptCount < maxAttempts) {
    delay(500);
    Serial.print(".");
    attemptCount++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    printWiFiConnectionDetails();
  } else {
    wifiConnected = false;
    Serial.println("[ERROR] Kết nối WiFi thất bại!");
    printWiFiErrorCode(WiFi.status());
  }
}

// ============================================
// Function: In chi tiết kết nối WiFi
// ============================================
void printWiFiConnectionDetails() {
  Serial.println("\n========================================");
  Serial.println("   ✓ CONNECTED TO WiFi SUCCESSFULLY!");
  Serial.println("========================================");
  Serial.printf("SSID: %s\n", WiFi.SSID().c_str());
  Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Gateway: %s\n", WiFi.gatewayIP().toString().c_str());
  Serial.printf("Subnet Mask: %s\n", WiFi.subnetMask().toString().c_str());
  Serial.printf("DNS 1: %s\n", WiFi.dnsIP(0).toString().c_str());
  Serial.printf("DNS 2: %s\n", WiFi.dnsIP(1).toString().c_str());
  Serial.printf("Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());
  Serial.printf("Channel: %d\n", WiFi.channel());
  Serial.println("========================================\n");
}

// ============================================
// Function: In mã lỗi kết nối WiFi
// ============================================
void printWiFiErrorCode(wl_status_t status) {
  Serial.print("[WiFi Error Code: ");
  switch (status) {
    case WL_IDLE_STATUS:
      Serial.println("WL_IDLE_STATUS - Đang chờ");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("WL_NO_SSID_AVAIL - SSID không tìm thấy");
      break;
    case WL_SCAN_COMPLETED:
      Serial.println("WL_SCAN_COMPLETED - Scan hoàn thành");
      break;
    case WL_CONNECTED:
      Serial.println("WL_CONNECTED - Đã kết nối");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("WL_CONNECT_FAILED - Kết nối thất bại");
      break;
    case WL_DISCONNECTED:
      Serial.println("WL_DISCONNECTED - Đã ngắt kết nối");
      break;
    case WL_NO_SHIELD:
      Serial.println("WL_NO_SHIELD - WiFi Shield không có");
      break;
    default:
      Serial.printf("UNKNOWN (%d)", status);
  }
  Serial.println("]");
}

// ============================================
// Function: Test kết nối WiFi định kỳ
// ============================================
void testWiFiConnection() {
  Serial.printf("\n[%lu ms] --- WiFi Connection Status Check ---\n", millis());
  Serial.printf("Status: %s\n", getWiFiStatusString(WiFi.status()));
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());
    
    // Kiểm tra mức tín hiệu
    int rssi = WiFi.RSSI();
    if (rssi > -50) {
      Serial.println("Signal Quality: Excellent (>-50 dBm)");
    } else if (rssi > -60) {
      Serial.println("Signal Quality: Good (-50 to -60 dBm)");
    } else if (rssi > -70) {
      Serial.println("Signal Quality: Fair (-60 to -70 dBm)");
    } else {
      Serial.println("Signal Quality: Weak (<-70 dBm)");
    }
    
    // Thử ping Google DNS
    Serial.print("Ping test (8.8.8.8): ");
    if (pingHost("8.8.8.8")) {
      Serial.println("✓ Success");
    } else {
      Serial.println("✗ Failed");
    }
  } else {
    Serial.println("WiFi NOT connected!");
  }
}

// ============================================
// Function: Lấy chuỗi trạng thái WiFi
// ============================================
const char* getWiFiStatusString(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS:
      return "Idle";
    case WL_NO_SSID_AVAIL:
      return "No SSID Available";
    case WL_SCAN_COMPLETED:
      return "Scan Completed";
    case WL_CONNECTED:
      return "Connected";
    case WL_CONNECT_FAILED:
      return "Connect Failed";
    case WL_DISCONNECTED:
      return "Disconnected";
    case WL_NO_SHIELD:
      return "No Shield";
    default:
      return "Unknown";
  }
}

// ============================================
// Function: Ping host
// ============================================
bool pingHost(const char* host) {
  IPAddress ip;
  if (!WiFi.hostByName(host, ip)) {
    return false;
  }
  return true;
}

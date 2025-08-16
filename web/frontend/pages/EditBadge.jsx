import React, { useState, useCallback, useEffect } from "react";
import {
  Page,
  Card,
  Form,
  FormLayout,
  TextField,
  DatePicker,
  ColorPicker,
  Select,
  Button,
  ButtonGroup,
  Spinner,
  Text,
  Banner,
  Popover,
  Box,
  BlockStack,
} from "@shopify/polaris";
import { useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";

// Correct HSB to Hex conversion (based on your working reference)
const hsbToHex = ({ hue, saturation, brightness }) => {
  const h = hue / 360;
  const s = saturation;
  const b = brightness;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);

  let r, g, bVal;
  switch (i % 6) {
    case 0: r = b; g = t; bVal = p; break;
    case 1: r = q; g = b; bVal = p; break;
    case 2: r = p; g = b; bVal = t; break;
    case 3: r = p; g = q; bVal = b; break;
    case 4: r = t; g = p; bVal = b; break;
    case 5: r = b; g = p; bVal = q; break;
  }

  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`.toUpperCase();
};

// Hex to HSB conversion (based on your working reference)
const hexToHsb = (hex) => {
  if (!hex || !hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
    return null;
  }

  let r, g, b;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255;
    g = parseInt(hex[2] + hex[2], 16) / 255;
    b = parseInt(hex[3] + hex[3], 16) / 255;
  } else {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const brightness = max;

  if (delta !== 0) {
    if (max === r) h = (g - b) / delta;
    else if (max === g) h = 2 + (b - r) / delta;
    else h = 4 + (r - g) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) h += 360;

  return { hue: h, saturation: s, brightness };
};

const EditBadge = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  console.log("========", id); // Debug ID

  // State for form fields
  const [timerName, setTimerName] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState("");
  const [promotionDescription, setPromotionDescription] = useState("");
  
  // Initialize with proper HSB values (saturation and brightness as decimals 0-1)
  const [color, setColor] = useState({
    hue: 210,
    saturation: 1,
    brightness: 0.8,
  });
  const [colorHex, setColorHex] = useState('#0099CC');
  const [colorPickerActive, setColorPickerActive] = useState(false);
  
  const [timerSize, setTimerSize] = useState("Medium");
  const [timerPosition, setTimerPosition] = useState("Top");
  const [urgencyNotification, setUrgencyNotification] = useState("Color pulse");
  const [urgencyTriggerThreshold, setUrgencyTriggerThreshold] = useState("1");
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [startMonthYear, setStartMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [endMonthYear, setEndMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Show toast message with fallback
  const showToastMessage = (message, isError) => {
    if (shopify?.toast?.show) {
      shopify.toast.show(message, {
        duration: 3000,
        isError: isError,
      });
    } else {
      console.warn("Shopify toast not available:", message);
      alert(message);
    }
  };

  // Handle color change from ColorPicker
  const handleColorChange = useCallback((newColor) => {
    console.log('Color picker changed:', newColor);
    setColor(newColor);
    const hexValue = hsbToHex(newColor);
    setColorHex(hexValue);
    console.log('Converted to hex:', hexValue);
  }, []);

  // Handle hex input change
  const handleHexChange = useCallback((value) => {
    const cleanedValue = value.toUpperCase();
    setColorHex(cleanedValue);

    if (/^#[0-9A-F]{6}$/.test(cleanedValue) || /^#[0-9A-F]{3}$/.test(cleanedValue)) {
      const hsbColor = hexToHsb(cleanedValue);
      if (hsbColor) {
        setColor(hsbColor);
      }
    }
  }, []);

  // Fetch badge data on component mount
  const fetchBadge = useCallback(async () => {
    if (!id) {
      setFetchError("Invalid badge ID");
      setIsLoading(false);
      return;
    }

    if (!shopify?.config?.shop || !shopify?.config?.host) {
      setFetchError("Shopify configuration is missing");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(
        `/api/getBadge/${id}?shop=${encodeURIComponent(
          shopify.config.shop
        )}&host=${encodeURIComponent(shopify.config.host)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch badge");
      }

      const data = await response.json();
      console.log("Fetched badge data:", data);
      const badge = data.badge || {};

      if (!badge) {
        throw new Error("Badge not found");
      }

      // Populate form with fetched data
      setTimerName(badge.timerName || "");
      setStartDate(badge.startDate ? new Date(badge.startDate) : null);
      setStartTime(badge.startTime || "");
      setEndDate(badge.endDate ? new Date(badge.endDate) : null);
      setEndTime(badge.endTime || "");
      setPromotionDescription(badge.promotionDescription || "");

      // Parse color from hex to HSB for ColorPicker
      if (badge.color && /^#[0-9A-Fa-f]{6}$/.test(badge.color)) {
        const hsbColor = hexToHsb(badge.color);
        if (hsbColor) {
          setColor(hsbColor);
          setColorHex(badge.color.toUpperCase());
        }
      }

      setTimerSize(badge.timerSize || "Medium");
      setTimerPosition(badge.timerPosition || "Top");
      setUrgencyNotification(badge.urgencyNotification || "Color pulse");
      setUrgencyTriggerThreshold(
        badge.urgencyTriggerThreshold
          ? (badge.urgencyTriggerThreshold / 3600).toString()
          : "1"
      );
    } catch (error) {
      setFetchError(error.message || "An error occurred while fetching badge");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBadge();
  }, [fetchBadge]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!timerName || timerName.length < 3) {
      newErrors.timerName = timerName
        ? "Timer name must be at least 3 characters"
        : "Timer name is required";
    }
    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!endDate) {
      newErrors.endDate = "End date is required";
    }
    if (!urgencyNotification) {
      newErrors.urgencyNotification = "Urgency notification is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!shopify?.config?.shop || !shopify?.config?.host) {
      showToastMessage("Shopify configuration is missing", true);
      return;
    }

    console.log('Submitting with color:', color, 'Hex:', colorHex);

    const badgeData = {
      timerName,
      startDate: startDate
        ? startDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })
        : "",
      startTime,
      endDate: endDate
        ? endDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })
        : "",
      endTime,
      promotionDescription,
      color: colorHex, // Use the hex color directly
      timerSize,
      timerPosition,
      urgencyNotification,
      urgencyTriggerThreshold: parseInt(urgencyTriggerThreshold) * 3600,
    };

    try {
      const response = await fetch(
        `/api/updateBadge/${id}?shop=${encodeURIComponent(
          shopify.config.shop
        )}&host=${encodeURIComponent(shopify.config.host)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(badgeData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update badge");
      }

      const result = await response.json();
      showToastMessage(
        result.message || "Timer badge updated successfully!",
        false
      );
      console.log("Badge updated:", result);
      navigate("/");
    } catch (error) {
      showToastMessage(error.message, true);
      console.error("Error updating badge:", error);
    }
  };

  // Date picker handlers
  const handleStartMonthChange = useCallback(
    (month, year) => setStartMonthYear({ month, year }),
    []
  );

  const handleEndMonthChange = useCallback(
    (month, year) => setEndMonthYear({ month, year }),
    []
  );

  const handleStartDateChange = useCallback((dateRange) => {
    if (dateRange.start) {
      setStartDate(dateRange.start);
      setIsStartDatePickerOpen(false);
      setErrors((prev) => ({ ...prev, startDate: null }));
    }
  }, []);

  const handleEndDateChange = useCallback((dateRange) => {
    if (dateRange.start) {
      setEndDate(dateRange.start);
      setIsEndDatePickerOpen(false);
      setErrors((prev) => ({ ...prev, endDate: null }));
    }
  }, []);

  // Form field handlers
  const handleTimerNameChange = useCallback((value) => {
    setTimerName(value);
    setErrors((prev) => ({
      ...prev,
      timerName:
        value && value.length < 3
          ? "Timer name must be at least 3 characters"
          : null,
    }));
  }, []);

  const handleUrgencyNotificationChange = useCallback((value) => {
    setUrgencyNotification(value);
    setErrors((prev) => ({
      ...prev,
      urgencyNotification: value ? null : "Urgency notification is required",
    }));
  }, []);

  // Render loading or error state
  if (isLoading) {
    return (
      <Page title="Edit Timer">
        <Card sectioned>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <Spinner accessibilityLabel="Loading badge" size="large" />
          </div>
        </Card>
      </Page>
    );
  }

  if (fetchError) {
    return (
      <Page title="Edit Timer">
        <Card sectioned>
          <Banner title="Error" tone="critical">
            <Text>{fetchError}</Text>
            <Button onClick={fetchBadge}>Retry</Button>
          </Banner>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Edit Timer"
      backAction={{
        content: "Back",
        onAction: () => navigate("/"),
      }}
    >
      <Card sectioned>
        <Form>
          <FormLayout>
            <TextField
              label="Timer name *"
              value={timerName}
              onChange={handleTimerNameChange}
              placeholder="Enter timer name"
              required
              minLength={3}
              error={errors.timerName}
            />
            <FormLayout.Group>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Start date *"
                  value={
                    startDate
                      ? startDate.toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : ""
                  }
                  onFocus={() => setIsStartDatePickerOpen(true)}
                  placeholder="mm/dd/yyyy"
                  readOnly
                  error={errors.startDate}
                />
                {isStartDatePickerOpen && (
                  <DatePicker
                    month={startMonthYear.month}
                    year={startMonthYear.year}
                    onChange={handleStartDateChange}
                    onMonthChange={handleStartMonthChange}
                    selected={startDate}
                    disableDatesAfter={endDate || new Date("2030-01-01")}
                    allowRange={false}
                    disableDatesBefore={new Date("2020-01-01")}
                  />
                )}
              </div>
              <TextField
                label="Start time"
                type="time"
                value={startTime}
                onChange={setStartTime}
              />
            </FormLayout.Group>
            <FormLayout.Group>
              <div style={{ flex: 1 }}>
                <TextField
                  label="End date *"
                  value={
                    endDate
                      ? endDate.toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : ""
                  }
                  onFocus={() => setIsEndDatePickerOpen(true)}
                  placeholder="mm/dd/yyyy"
                  readOnly
                  error={errors.endDate}
                />
                {isEndDatePickerOpen && (
                  <DatePicker
                    month={endMonthYear.month}
                    year={endMonthYear.year}
                    onChange={handleEndDateChange}
                    onMonthChange={handleEndMonthChange}
                    selected={endDate}
                    disableDatesBefore={startDate || new Date("2020-01-01")}
                    allowRange={false}
                    disableDatesAfter={new Date("2030-01-01")}
                  />
                )}
              </div>
              <TextField
                label="End time"
                type="time"
                value={endTime}
                onChange={setEndTime}
              />
            </FormLayout.Group>
            <TextField
              label="Promotion description"
              value={promotionDescription}
              onChange={setPromotionDescription}
              placeholder="Enter promotion details"
              multiline={4}
              autoComplete="off"
              maxLength={500}
              showCharacterCount
            />
            
            {/* Color Picker Section - Based on your working reference */}
            <BlockStack gap="200">
              <Text variant="bodyMd">Timer Color</Text>
              <FormLayout.Group>
                <Popover
                  active={colorPickerActive}
                  activator={
                    <Button
                      onClick={() => setColorPickerActive(!colorPickerActive)}
                      disclosure
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Box
                          background={colorHex}
                          width="20px"
                          height="20px"
                          borderRadius="4px"
                          style={{ border: '1px solid #e1e3e5' }}
                        />
                        <Text>Choose Color</Text>
                      </div>
                    </Button>
                  }
                  onClose={() => setColorPickerActive(false)}
                >
                  <Popover.Pane>
                    <ColorPicker
                      onChange={handleColorChange}
                      color={color}
                    />
                  </Popover.Pane>
                </Popover>
                <TextField
                  label="Hex Value"
                  value={colorHex}
                  onChange={handleHexChange}
                  placeholder="#0099CC"
                  helpText="Enter a 3 or 6 digit hex color (e.g., #FFF or #FF0000)"
                />
              </FormLayout.Group>
            </BlockStack>
            
            <FormLayout.Group>
              <Select
                label="Timer size"
                options={["Small", "Medium", "Large"]}
                value={timerSize}
                onChange={setTimerSize}
              />
              <Select
                label="Timer position"
                options={["Top", "Bottom", "Left", "Right"]}
                value={timerPosition}
                onChange={setTimerPosition}
              />
            </FormLayout.Group>
            <FormLayout.Group>
              <Select
                label="Urgency notification *"
                options={["Color pulse", "Notification banner", "None"]}
                value={urgencyNotification}
                onChange={handleUrgencyNotificationChange}
                error={errors.urgencyNotification}
              />
              <TextField
                label="Urgency trigger (hours before end)"
                type="number"
                value={urgencyTriggerThreshold}
                onChange={setUrgencyTriggerThreshold}
                min="0"
                step="0.1"
                error={
                  urgencyTriggerThreshold &&
                  parseFloat(urgencyTriggerThreshold) < 0
                    ? "Urgency trigger cannot be negative"
                    : null
                }
              />
            </FormLayout.Group>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ButtonGroup>
                <Button onClick={() => navigate("/")}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Update Timer
                </Button>
              </ButtonGroup>
            </div>
          </FormLayout>
        </Form>
      </Card>
    </Page>
  );
};

export default EditBadge;
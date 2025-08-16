import React, { useState, useCallback } from "react";
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
  Toast,
  Popover,
  Box,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

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

const CreateBadge = () => {
  const navigate = useNavigate();
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

  const showToastMessage = (message, isError) => {
    shopify.toast.show(message, {
      duration: 3000,
      isError: isError,
    });
  };

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

  const handleSubmit = async () => {
    if (!validateForm()) {
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
      color: colorHex,
      timerSize,
      timerPosition,
      urgencyNotification,
      urgencyTriggerThreshold: parseInt(urgencyTriggerThreshold) * 3600,
    };

    try {
      const response = await fetch(
        `/api/createBadge?shop=${encodeURIComponent(
          shopify?.config?.shop || ""
        )}&host=${encodeURIComponent(shopify?.config?.host || "")}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(badgeData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create badge");
      }

      const result = await response.json();
      showToastMessage(
        result.message || "TimerBadge created successfully!",
        false
      );
      console.log("Badge created:", result);

      // Reset form
      setTimerName("");
      setStartDate(null);
      setStartTime("");
      setEndDate(null);
      setEndTime("");
      setPromotionDescription("");
      setColor({ hue: 210, saturation: 1, brightness: 0.8 });
      setColorHex('#0099CC');
      setTimerSize("Medium");
      setTimerPosition("Top");
      setUrgencyNotification("Color pulse");
      setUrgencyTriggerThreshold("1");
      setErrors({});
      navigate("/");
    } catch (error) {
      showToastMessage(error.message, true);
      console.error("Error creating badge:", error);
    }
  };

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

  return (
    <Page
      title="Create New Timer"
      backAction={{
        content: "Back",
        onAction: () => navigate("/"),
      }}
    >
      <Card sectioned>
        <Form onSubmit={handleSubmit}>
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
                  Create timer
                </Button>
              </ButtonGroup>
            </div>
          </FormLayout>
        </Form>
      </Card>
    </Page>
  );
};

export default CreateBadge;
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
} from "@shopify/polaris";
import { useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";

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
  const [color, setColor] = useState({
    hue: 120,
    saturation: 50,
    brightness: 80,
  });
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
      // Fallback: Use alert or log
      alert(message);
    }
  };

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
      console.log("Fetched badge data:", data); // Debug API response
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

      // Parse color from hsb(h, s%, b%) to { hue, saturation, brightness }
      if (badge.color) {
        const match = badge.color.match(/hsb\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
          setColor({
            hue: parseInt(match[1]),
            saturation: parseInt(match[2]),
            brightness: parseInt(match[3]),
          });
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
  }, [id, shopify]);

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
      return; // Stop submission, show errors below fields
    }

    if (!shopify?.config?.shop || !shopify?.config?.host) {
      showToastMessage("Shopify configuration is missing", true);
      return;
    }

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
      color: `hsb(${color.hue}, ${color.saturation}%, ${color.brightness}%)`,
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
          method: "PATCH",
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

      // Navigate back to HomePage after successful update
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
            <FormLayout.Group>
              <div style={{ padding: "10px 0" }}>
                <ColorPicker onChange={setColor} color={color} allowAlpha />
              </div>
              <div />
            </FormLayout.Group>
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

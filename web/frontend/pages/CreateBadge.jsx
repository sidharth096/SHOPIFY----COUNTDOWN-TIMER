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
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

const CreateBadge = () => {
  const navigate = useNavigate()
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


  const showToastMessage = (message, isError)=>{
    shopify.toast.show(message,{
      duration:3000,
      isError: isError
    })
  }



  const validateForm = () => {
    const newErrors = {};
    if (!timerName || timerName.length < 3) {
      newErrors.timerName = timerName ? "Timer name must be at least 3 characters" : "Timer name is required";
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return; // Stop submission, show errors below fields
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
      showToastMessage(result.message || "TimerBadge created successfully!",false)
      console.log("Badge created:", result);

      // Reset form after successful submission
      setTimerName("");
      setStartDate(null);
      setStartTime("");
      setEndDate(null);
      setEndTime("");
      setPromotionDescription("");
      setColor({ hue: 120, saturation: 50, brightness: 80 });
      setTimerSize("Medium");
      setTimerPosition("Top");
      setUrgencyNotification("Color pulse");
      setUrgencyTriggerThreshold("1");
      setErrors({});
    } catch (error) {
      showToastMessage(error.message,true)
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
    setErrors((prev) => ({ ...prev, timerName: value && value.length < 3 ? "Timer name must be at least 3 characters" : null }));
  }, []);

  const handleUrgencyNotificationChange = useCallback((value) => {
    setUrgencyNotification(value);
    setErrors((prev) => ({ ...prev, urgencyNotification: value ? null : "Urgency notification is required" }));
  }, []);



  return (
    <Page title="Create New Timer"  backAction={{
      content: 'Back',
      onAction: () => navigate('/')
    }}>
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
                  urgencyTriggerThreshold && parseFloat(urgencyTriggerThreshold) < 0
                    ? "Urgency trigger cannot be negative"
                    : null
                }
              />
            </FormLayout.Group>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ButtonGroup>
                <Button onClick={()=>navigate("/")}>Cancel</Button>
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
import { Page, Card, DataTable, Button, Text, Spinner } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  // State for badges, loading, and error
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch badges from API
  const fetchBadges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/getBadges?shop=${encodeURIComponent(
          shopify?.config?.shop || ""
        )}&host=${encodeURIComponent(shopify?.config?.host || "")}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data = await response.json();
      // Extract the badges array from the response
      setBadges(data.badges || []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching badges');
    } finally {
      setIsLoading(false);
    }
  }, [shopify]);

  // Fetch badges on component mount
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Navigate to configuration page
  const handleConfigure = () => {
    navigate('/createBadge');
  };

  // Navigate to edit badge page
  const handleEdit = (badgeId) => {
    navigate(`/editBadge/${badgeId}`);
  };

  // Table rows for DataTable
  const rows = badges.map((badge) => {
    // Combine endDate and endTime (if endTime is provided)
    const endDateTime = badge.endTime
      ? new Date(`${badge.endDate}T${badge.endTime}`).toLocaleString()
      : new Date(badge.endDate).toLocaleString();
    // Format startDate
    const startDateTime = new Date(badge.startDate).toLocaleString();

    return [
      badge.timerName, // Maps to message
      startDateTime, // Maps to start_date
      endDateTime, // Maps to end_time
      badge.color, // Maps to background_color
      'hsb(0, 0%, 0%)', // Default text_color (since not provided in API)
      <Button size="slim" onClick={() => handleEdit(badge._id)}>
        {t('HomePage.table.edit', { defaultValue: 'Edit' })}
      </Button>, // Edit button
    ];
  });

  return (
    <Page title={t('HomePage.title', { defaultValue: 'Timer Badge Dashboard' })}>
      <TitleBar title={t('HomePage.title', { defaultValue: 'Timer Badge Dashboard' })} />
      <Card>
        <div style={{ padding: '16px' }}>
          <Text as="h2" variant="headingMd">
            {t('HomePage.heading', { defaultValue: 'Manage Your Timer Badges' })}
          </Text>
          <div style={{ margin: '16px 0' }}>
            <Button primary onClick={handleConfigure}>
              {t('HomePage.configureButton', { defaultValue: 'Configure Timer Badge' })}
            </Button>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Spinner accessibilityLabel="Loading badges" size="large" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Text color="critical">{error}</Text>
              <Button onClick={fetchBadges}>
                {t('HomePage.retryButton', { defaultValue: 'Retry' })}
              </Button>
            </div>
          ) : badges.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={[
                t('HomePage.table.message', { defaultValue: 'Message' }),
                t('HomePage.table.startTime', { defaultValue: 'Start Time' }),
                t('HomePage.table.endTime', { defaultValue: 'End Time' }),
                t('HomePage.table.backgroundColor', { defaultValue: 'Background Color' }),
                t('HomePage.table.textColor', { defaultValue: 'Text Color' }),
                t('HomePage.table.actions', { defaultValue: 'Actions' }),
              ]}
              rows={rows}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Text>{t('HomePage.noBadges', { defaultValue: 'No timer badges configured yet.' })}</Text>
              <Button primary onClick={handleConfigure}>
                {t('HomePage.createBadge', { defaultValue: 'Create a Timer Badge' })}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Page>
  );
}
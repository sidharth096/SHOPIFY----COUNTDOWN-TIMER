import { Page, Card, DataTable, Button, Text } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  // Static sample badge data
  const badges = [
    {
      message: 'Hurry! Sale ends soon!',
      end_time: '2025-08-20T23:59:59',
      background_color: 'hsb(120, 50%, 80%)',
      text_color: 'hsb(0, 0%, 0%)',
    },
    {
      message: 'Limited Offer!',
      end_time: '2025-08-15T18:00:00',
      background_color: 'hsb(0, 70%, 90%)',
      text_color: 'hsb(0, 0%, 100%)',
    },
  ];

  // Navigate to configuration page
  const handleConfigure = () => {
    navigate("/createBadge")
    
  };

  // Table rows for DataTable
  const rows = badges.map((badge) => [
    badge.message,
    new Date(badge.end_time).toLocaleString(),
    badge.background_color,
    badge.text_color,
  ]);

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
          {badges.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={[
                t('HomePage.table.message', { defaultValue: 'Message' }),
                t('HomePage.table.endTime', { defaultValue: 'End Time' }),
                t('HomePage.table.backgroundColor', { defaultValue: 'Background Color' }),
                t('HomePage.table.textColor', { defaultValue: 'Text Color' }),
              ]}
              rows={rows}
            />
          ) : (
            <Text>{t('HomePage.noBadges', { defaultValue: 'No timer工夫timer badges configured yet.' })}</Text>
          )}
        </div>
      </Card>
    </Page>
  );
}
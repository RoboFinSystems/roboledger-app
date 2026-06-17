import { SecureApiKeyField } from '@robosystems/core'

/** Default masked state — key value is hidden behind dots, with reveal / copy / download actions. */
export const Masked = () => (
  <div className="max-w-xl">
    <SecureApiKeyField
      apiKey="rfs_live_8f3c2a9d4b1e7f6a0c5d2e8b9a4f1c3d"
      keyId="rfs_live"
      keyName="Production API Key"
    />
  </div>
)

/** With its own label rendered above the field. */
export const WithLabel = () => (
  <div className="max-w-xl">
    <SecureApiKeyField
      apiKey="rfs_test_2b7e1d9c8a4f3e6d0b5c2a8f9e1d4c7b"
      keyId="rfs_test"
      keyName="Sandbox API Key"
      showLabel
      label="Sandbox API Key"
    />
  </div>
)

/** A short read-only secret — the masked prefix shows the key family it belongs to. */
export const ServiceKey = () => (
  <div className="max-w-xl">
    <SecureApiKeyField
      apiKey="rfs_svc_a1b2c3d4e5f60718293a4b5c6d7e8f90"
      keyId="rfs_svc_"
      keyName="Service Account Key"
      onCopy={() => {}}
      onReveal={() => {}}
      onDownload={() => {}}
    />
  </div>
)

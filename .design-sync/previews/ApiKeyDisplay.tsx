import { ApiKeyDisplay } from '@robosystems/core'

/** A bold label above a secure, masked key field with reveal / copy / download actions. */
export const Production = () => (
  <div className="max-w-xl">
    <ApiKeyDisplay
      label="Production API Key"
      value="rfs_live_8f3c2a9d4b1e7f6a0c5d2e8b9a4f1c3d"
      keyId="rfs_live"
      onCopy={() => {}}
      onReveal={() => {}}
      onDownload={() => {}}
    />
  </div>
)

/** Several keys stacked — the typical "API Keys" settings panel layout. */
export const Stacked = () => (
  <div className="flex max-w-xl flex-col gap-6">
    <ApiKeyDisplay
      label="Live Key"
      value="rfs_live_8f3c2a9d4b1e7f6a0c5d2e8b9a4f1c3d"
      keyId="rfs_live"
    />
    <ApiKeyDisplay
      label="Test Key"
      value="rfs_test_2b7e1d9c8a4f3e6d0b5c2a8f9e1d4c7b"
      keyId="rfs_test"
    />
  </div>
)

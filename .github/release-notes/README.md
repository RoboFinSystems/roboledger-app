# Curated release notes

`tag-release.yml` generates the GitHub release body from a Claude-written
changelog of the changes since the last tag. That framing suits routine
releases but reads poorly for a milestone, where the story is what the version
_is_ rather than what changed since last Tuesday.

To override it, commit the notes here as `v<version>.md` **before** dispatching
`create-release.yml`. The file has to exist at the tagged ref, and
`create-release.yml` cuts `release/<version>` from `main` and tags it in the
same run — so the notes must be merged to `main` before the dispatch, not
added to the release branch afterwards. When the file is present the workflow
uses it verbatim and skips the generated changelog, the release-statistics
section, and the generated-with footer.

No file, no change: the release falls back to the generated changelog. Skipping
a release is a normal outcome, not a failure.

## Writing a new one

Write the body only. The workflow supplies the `# RoboLedger App v<version>`
heading and the links section, so don't repeat them here — start at the first
line of prose.

The filename is version-specific on purpose: a leftover file can never be picked
up by a later release.

## Prior notes

`v1.0.0.md` is the first release written this way — the 1.0.0 graduation from
0.x. It is body-only and reflects the format above, so it reads as a working
example rather than an archived record. Its tag already exists, so the workflow
short-circuits before reading it and it can never affect a future release.

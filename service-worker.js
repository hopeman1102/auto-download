// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const GOOGLE_ORIGIN = 'https://www.handelsregister.de';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  await chrome.sidePanel.setOptions({
    tabId,
    path: './pages/sidepanel.html',
    enabled: true
  });
});

chrome.downloads.onChanged.addListener(function(downloadDelta) {
  if (downloadDelta.state && downloadDelta.state.current === "complete") {
    // Download completed
    // console.log("Download completed:", downloadDelta.id);
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        const tabId = tabs[0].id;
        chrome.tabs.update(tabId, { url: 'https://www.handelsregister.de/rp_web/ergebnisse.xhtml' });
      }
    });
  }
});
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.search) {
            updateUI();
        }
    });
});

function updateObjectByName(array, name, updatedProperties) {
    const index = array.findIndex(obj => obj.name === name);
    if (index !== -1) {
        // Update the object's properties
        array[index] = { ...array[index], ...updatedProperties };
    }
}

function deleteChildrenAndAppend(parent, elements) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    parent.append(...elements);
}

async function updateUI() {
    const saveContainer = document.getElementById('save-container');
    const searchContainer = document.getElementById('search-container');

    const { savedCompanies } = await chrome.storage.local.get('savedCompanies');
    const { searchCompanies } = await chrome.storage.local.get('searchCompanies');
    const { selectedCompany } = await chrome.storage.local.get('selectedCompany');
    let notices = [];
    // show saved companies
    if(savedCompanies && savedCompanies.length > 0) {
        const template = document.getElementById("save-tbody-template");
        const elements = new Set();
        for (let i = 0; i < savedCompanies.length; i ++) {
            const company = savedCompanies[i];
            const element = template.content.firstElementChild.cloneNode(true);
            if(selectedCompany === company.name) {
                element.classList.add("table-primary");
                notices = company.notices;
                chrome.storage.local.set({selectedCompany: null});
            }

            element.querySelector('.no').textContent = (i + 1);
            element.querySelector(".name").textContent = company.name;
            const checkboxes = element.querySelectorAll('.form-check-input');
            for(const checkbox of checkboxes) {
                checkbox.addEventListener('click', async function() {
                    const { savedCompanies } = await chrome.storage.local.get('savedCompanies');
                    updateObjectByName(savedCompanies, company.name, {[checkbox.id]: checkbox.checked})
                    chrome.storage.local.set({savedCompanies});
                })
            }

            element.querySelector('#show-button').addEventListener('click', async function() {
                const { savedCompanies } = await chrome.storage.local.get('savedCompanies');
                updateObjectByName(savedCompanies, company.name, {down: true})
                chrome.storage.local.set({savedCompanies});
                chrome.storage.local.set({selectedCompany: company.name});
                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    // Update the URL of the tab
                    chrome.tabs.update(tabs[0].id, { url: 'https://www.handelsregister.de/rp_web/normalesuche.xhtml' });
                });
            });

            element.querySelector('#delete-button').addEventListener('click', function() {
                const datas = savedCompanies.filter((c) => c.name !== company.name);
                chrome.storage.local.set({savedCompanies: datas});
                updateUI();
            })
            elements.add(element);
        }
        deleteChildrenAndAppend(document.getElementById("save-content"), elements);
        saveContainer.style = "display";
    } else {
        saveContainer.style = "display:none";
    }

    // show search resutls
    if(searchCompanies && searchCompanies.length > 0) {
        const filters = savedCompanies ? searchCompanies.filter(value => !savedCompanies.map((c) => c.name).includes(value.name)) : searchCompanies;
        if(filters.length > 0) {
            const template = document.getElementById("search-tbody-template");
            const elements = new Set();
            for (let i = 0; i < filters.length; i ++) {
                const company = filters[i];
                const element = template.content.firstElementChild.cloneNode(true);
                element.querySelector('.no').textContent = (i + 1);
                element.querySelector(".name").textContent = company.name;
                const checkBox = element.querySelector('#save-checkbox');
                checkBox.addEventListener('click', function() {
                    const comps = savedCompanies ? savedCompanies : [];
                    const datas = checkBox.checked == true ? [...comps, company] : comps.filter((c) => c.name !== company.name);
                    chrome.storage.local.set({savedCompanies: datas});
                    updateUI();
    
                });
                elements.add(element);
            }
            deleteChildrenAndAppend(document.getElementById("search-content"), elements);
            searchContainer.style = "display";
        } else {
            searchContainer.style = "display:none";
        }
    } else {
        searchContainer.style = "display:none";
    }
}

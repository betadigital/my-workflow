sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("sap.ui.workflowtrial.controller.Details", {
        onInit: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("details").attachPatternMatched(this._onRouteMatched, this);
            var busyModel = new sap.ui.model.json.JSONModel({ isBusy: false });
            this.getView().setModel(busyModel, "busyModel");
        },

        _onRouteMatched: function (oEvent) {
            const instanceId = oEvent.getParameter("arguments").rowId;
            const oWorkflowModel = this.getOwnerComponent().getModel("workflowModel");
            this.getAPIData(oWorkflowModel, instanceId);
        },

        getAPIData: async function (oWorkflowModel, instanceId) {
            const prefixUrl = this._getExternalServiceRuntimeBaseURL();
            let workflowData = await this._fetchWorkflowData(prefixUrl, instanceId);
            oWorkflowModel.setProperty("/context", workflowData)
            let uploadedFolder = workflowData ? workflowData.startEvent.uploadFiles : null;
            if (uploadedFolder) {
                var oBusyModel = this.getView().getModel("busyModel");
                oBusyModel.setProperty("/isBusy", true);
                let folderId = uploadedFolder.split(":").pop();
                let repoId = await this._fetchDMSRepo(prefixUrl);
                oWorkflowModel.setProperty("/filesRepo", repoId);
                let uploadedFiles = await this._fetchFileDataFromDMS(prefixUrl, repoId, folderId);
                const aFiles = this.formatFileCollection(uploadedFiles);
                oWorkflowModel.setProperty("/filesCollection", aFiles);
                oBusyModel.setProperty("/isBusy", false);
            }
        },

        _fetchWorkflowData: async function (prefixUrl, instanceId) {
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };

            try {
                const response = await fetch(`${prefixUrl}/SAP_Build_Workflow/v1/workflow-instances/${instanceId}/context`, requestOptions)
                if (!response.ok) {
                    throw new Error(`Error in fetching workflow instance with status: ${response.status}`)
                }
                const data = await response.json()
                return data;
            } catch (error) {
                console.error(error.message)
            }
        },

        _fetchDMSRepo: async function (prefixUrl) {
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };
            try {
                const response = await fetch(`${prefixUrl}/SAP_DMS/browser`, requestOptions)
                if (!response.ok) {
                    throw new Error(`Error in fetching dms repository with status: ${response.status}`)
                }
                const data = await response.json();
                return Object.keys(data)[0];
            } catch (error) {
                console.error(error.message)
            }
        },

        _fetchFileDataFromDMS: async function (prefixUrl, repoId, folderId) {
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };
            try {
                const response = await fetch(`${prefixUrl}/SAP_DMS/browser/${repoId}/root?cmisselector=children&objectId=${folderId}`, requestOptions)
                if (!response.ok) {
                    throw new Error(`Error in fetching files from dms repository with status: ${response.status}`)
                }
                const data = await response.json();
                return data;
            } catch (error) {
                console.error(error.message)
            }
        },

        onNavBack: function () {
            const oHistory = sap.ui.core.routing.History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                const oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo("RouteView1", {}, true);
            }
        },

        concatSponsorName: function (sFirstName, sLastName) {
            return `${sFirstName} ${sLastName}`
        },

        formatFileCollection: function (uploadedFiles) {
            if (!uploadedFiles) {
                return [];
            }
            let modifiedFiles = [];
            for (let file of uploadedFiles.objects) {
                let modifiedFileObj = {};
                modifiedFileObj.fileName = file.object.properties['cmis:name'].value
                modifiedFileObj.fileObjectId = file.object.properties['cmis:objectId'].value
                modifiedFiles.push(modifiedFileObj)
            }
            return modifiedFiles;
        },

        onAttachmentPress: function (oEvent) {
            let oSource = oEvent.getSource();
            let oWorkflowModel = oSource.getModel('workflowModel');
            let fileName = oSource.getProperty('fileName');
            let fileObjectId = oSource.getProperty('url');
            let repoId = oWorkflowModel.getProperty('/filesRepo')
            const prefixUrl = this._getExternalServiceRuntimeBaseURL();
            this._downloadFile(prefixUrl, repoId, fileName, fileObjectId)
        },

        _downloadFile: async function (prefixUrl, repoId, fileName, fileObjectId) {
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };

            fetch(`${prefixUrl}/SAP_DMS/browser/${repoId}/root?cmisselector=content&objectId=${fileObjectId}&download=attachment`, requestOptions)
                .then((response) => response.blob())
                .then((oBlob) => {
                    const oLink = document.createElement("a");
                    oLink.href = URL.createObjectURL(oBlob);
                    oLink.download = fileName;
                    oLink.click();
                    URL.revokeObjectURL(oLink.href);
                })
                .catch((error) => console.error("Error in downloading file with error message:", error));
        },

        _getExternalServiceRuntimeBaseURL: function () {
            var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
            if (oComponent) {
                var sAppId = oComponent.getManifestEntry("/sap.app/id");
                var sAppPath = sAppId.replaceAll(".", "/");
                var sAppModulePath = jQuery.sap.getModulePath(sAppPath);
                return sAppModulePath;
            } else {
                console.error("Component could not be found.");
                return "";
            }
        }
    });
});

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent"
], (Controller, UIComponent) => {
  "use strict";

  return Controller.extend("sap.ui.workflowtrial.controller.View1", {
    onInit: function () {
      const oWorkflowModel = this.getOwnerComponent().getModel("workflowModel");
      this.getDataFromAPI()
        .then((data) => {
          const oData = {
            rows: data
          }
          oWorkflowModel.setProperty("/workflowData", oData)
          this.getView().setModel(oWorkflowModel);
        })
        .catch((error) => {
          console.error(error.message)
        })
    },

    onRowSelect: function (oEvent) {
      const oSelectedItem = oEvent.getParameter("listItem");
      const oContext = oSelectedItem.getBindingContext('workflowModel');
      const instanceId = oContext.getProperty("id");
      UIComponent.getRouterFor(this).navTo("details", { rowId: instanceId });
    },

    getDataFromAPI: async function () {
      const prefixUrl = this._getExternalServiceRuntimeBaseURL();
      const user = await this._fetchUserData(prefixUrl);
      const data = await this._fetchApiData(prefixUrl, user)
      return data;
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
    },

    _fetchApiData: async function (prefixUrl, user) {
      const requestOptions = {
        method: "GET",
        redirect: "follow"
      };
      const url = user ? `${prefixUrl}/sap_process_automation_service_user_access/v1/workflow-instances?startedBy=${user.email}`
        : `${prefixUrl}/sap_process_automation_service_user_access/v1/workflow-instances`;
      try {
        const response = await fetch(url, requestOptions)
        if (!response.ok) {
          throw new Error(`Error in fetching workflow instances with status: ${response.status}`)
        }
        const data = await response.json()
        return data;
      } catch (error) {
        console.error(error.message)
      }
    },

    _fetchUserData: async function (prefixUrl) {
      const requestOptions = {
        method: "GET",
        redirect: "follow"
      };
      try {
        const response = await fetch(`${prefixUrl}/user_api/currentUser`, requestOptions)
        if (!response.ok) {
          throw new Error(`Error in fetching workflow instances with status: ${response.status}`)
        }
        const user = await response.json();
        return user;
      } catch (error) {
        console.error(error.message)
      }
    }
  });
});
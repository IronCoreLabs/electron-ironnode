const IronNode = require("@ironcorelabs/ironnode");

window.addEventListener("DOMContentLoaded", () => {
  const accountId = "";
  const segmentId = 0;
  const devicePrivateKey = "";
  const deviceSigningPrivateKey = "";

  const createAndDeleteGroup = sdk => {
    return sdk.group.create().then(group => {
      document.getElementById("ironnode").innerText = JSON.stringify(group);
      return sdk.group.deleteGroup(group.groupID);
    });
  };

  IronNode.initialize(
    accountId,
    segmentId,
    devicePrivateKey,
    deviceSigningPrivateKey
  ).then(createAndDeleteGroup);
});

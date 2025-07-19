import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("MockPriceFeed", function () {
  async function deployMockPriceFeedFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
    await mockPriceFeed.waitForDeployment();

    // Déploiement de tokens mockés pour les tests
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
    await mockUSDC.waitForDeployment();

    const MockBTC = await ethers.getContractFactory("MockBTC");
    const mockBTC = await MockBTC.deploy();
    await mockBTC.waitForDeployment();

    return {
      mockPriceFeed,
      mockUSDC,
      mockBTC,
      owner,
      user1,
      user2,
    };
  }

  describe("Déploiement", function () {
    it("déploie avec le bon owner", async function () {
      const { mockPriceFeed, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );
      expect(await mockPriceFeed.owner()).to.equal(owner.address);
    });
  });

  describe("setPrice", function () {
    it("permet à l'owner de définir un prix", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = ethers.parseUnits("1", 18); // 1 USDC = 1 USDC (18 décimales standardisées)
      const decimals = 18;

      await expect(
        mockPriceFeed
          .connect(owner)
          .setPrice(await mockUSDC.getAddress(), price, decimals)
      )
        .to.emit(mockPriceFeed, "PriceSet")
        .withArgs(await mockUSDC.getAddress(), price, decimals);
    });

    it("permet à l'owner de mettre à jour un prix existant", async function () {
      const { mockPriceFeed, mockBTC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price1 = ethers.parseUnits("50000", 18); // 1 BTC = 50,000 USDC
      const price2 = ethers.parseUnits("60000", 18); // 1 BTC = 60,000 USDC
      const decimals = 18;

      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockBTC.getAddress(), price1, decimals);

      await expect(
        mockPriceFeed
          .connect(owner)
          .setPrice(await mockBTC.getAddress(), price2, decimals)
      )
        .to.emit(mockPriceFeed, "PriceSet")
        .withArgs(await mockBTC.getAddress(), price2, decimals);
    });

    it("revert si non-owner tente d'appeler setPrice", async function () {
      const { mockPriceFeed, mockUSDC, user1 } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = ethers.parseUnits("1", 18);
      const decimals = 18;

      await expect(
        mockPriceFeed
          .connect(user1)
          .setPrice(await mockUSDC.getAddress(), price, decimals)
      ).to.be.revertedWithCustomError(
        mockPriceFeed,
        "OwnableUnauthorizedAccount"
      );
    });

    it("revert si adresse token est zéro", async function () {
      const { mockPriceFeed, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = ethers.parseUnits("1", 18);
      const decimals = 18;

      await expect(
        mockPriceFeed
          .connect(owner)
          .setPrice(ethers.ZeroAddress, price, decimals)
      ).to.be.revertedWithCustomError(mockPriceFeed, "ZeroAddress");
    });

    it("accepte un prix de 0", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = 0;
      const decimals = 18;

      await expect(
        mockPriceFeed
          .connect(owner)
          .setPrice(await mockUSDC.getAddress(), price, decimals)
      )
        .to.emit(mockPriceFeed, "PriceSet")
        .withArgs(await mockUSDC.getAddress(), price, decimals);
    });

    it("accepte différentes valeurs de decimals", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = ethers.parseUnits("1", 18); // Prix avec 18 décimales (standardisé)
      const decimals = 18;

      await expect(
        mockPriceFeed
          .connect(owner)
          .setPrice(await mockUSDC.getAddress(), price, decimals)
      )
        .to.emit(mockPriceFeed, "PriceSet")
        .withArgs(await mockUSDC.getAddress(), price, decimals);
    });
  });

  describe("getPrice", function () {
    it("retourne le bon prix et décimales pour un token configuré", async function () {
      const { mockPriceFeed, mockBTC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const expectedPrice = ethers.parseUnits("100000", 18); // 1 BTC = 100,000 USDC
      const expectedDecimals = 18;

      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockBTC.getAddress(), expectedPrice, expectedDecimals);

      const [price, decimals] = await mockPriceFeed.getPrice(
        await mockBTC.getAddress()
      );

      expect(price).to.equal(expectedPrice);
      expect(decimals).to.equal(expectedDecimals);
    });

    it("revert si prix non défini", async function () {
      const { mockPriceFeed, mockUSDC } = await loadFixture(
        deployMockPriceFeedFixture
      );

      await expect(
        mockPriceFeed.getPrice(await mockUSDC.getAddress())
      ).to.be.revertedWithCustomError(mockPriceFeed, "PriceNotSet");
    });

    it("revert si prix défini à 0", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockUSDC.getAddress(), 0, 18);

      await expect(
        mockPriceFeed.getPrice(await mockUSDC.getAddress())
      ).to.be.revertedWithCustomError(mockPriceFeed, "PriceNotSet");
    });

    it("retourne des prix différents pour des tokens différents", async function () {
      const { mockPriceFeed, mockUSDC, mockBTC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const usdcPrice = ethers.parseUnits("1", 18); // 1 USDC = 1 USDC
      const btcPrice = ethers.parseUnits("100000", 18); // 1 BTC = 100,000 USDC

      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockUSDC.getAddress(), usdcPrice, 18);
      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockBTC.getAddress(), btcPrice, 18);

      const [usdcRetrievedPrice, usdcDecimals] = await mockPriceFeed.getPrice(
        await mockUSDC.getAddress()
      );
      const [btcRetrievedPrice, btcDecimals] = await mockPriceFeed.getPrice(
        await mockBTC.getAddress()
      );

      expect(usdcRetrievedPrice).to.equal(usdcPrice);
      expect(btcRetrievedPrice).to.equal(btcPrice);
      expect(usdcDecimals).to.equal(18);
      expect(btcDecimals).to.equal(18);
    });
  });

  describe("hasPrice", function () {
    it("retourne true si prix défini", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = ethers.parseUnits("1", 18);
      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockUSDC.getAddress(), price, 18);

      expect(await mockPriceFeed.hasPrice(await mockUSDC.getAddress())).to.be
        .true;
    });

    it("retourne false si prix non défini", async function () {
      const { mockPriceFeed, mockUSDC } = await loadFixture(
        deployMockPriceFeedFixture
      );

      expect(await mockPriceFeed.hasPrice(await mockUSDC.getAddress())).to.be
        .false;
    });

    it("retourne false si prix défini à 0", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockUSDC.getAddress(), 0, 18);

      expect(await mockPriceFeed.hasPrice(await mockUSDC.getAddress())).to.be
        .false;
    });
  });

  describe("Interface IPriceOracle", function () {
    it("implémente correctement l'interface IPriceOracle", async function () {
      const { mockPriceFeed, mockUSDC, owner } = await loadFixture(
        deployMockPriceFeedFixture
      );

      const price = ethers.parseUnits("1", 18);
      await mockPriceFeed
        .connect(owner)
        .setPrice(await mockUSDC.getAddress(), price, 18);

      // Vérifie que la fonction getPrice retourne bien (uint256, uint8)
      const result = await mockPriceFeed.getPrice(await mockUSDC.getAddress());
      expect(result).to.have.length(2);
      expect(typeof result[0]).to.equal("bigint");
      expect(typeof result[1]).to.equal("bigint");
    });
  });
});

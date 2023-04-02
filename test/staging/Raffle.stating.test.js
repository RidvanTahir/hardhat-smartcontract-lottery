// 1. Get out subId for Chainlink VRF
// 2. Deploy our contractusign the SubId
// 3. RRegister the contract with Chainlink VRF and it's SubId
// 4. Register the contract with Chainlink keeper
// 5. Run the staging tests

const { assert, expect } = require("chai")
const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Tests", async function () {
          let raffle, VRFCoordinatorV2Mock, raffleEntranceFee, deployer, interval, accounts
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEnteranceFee()
              interval = await raffle.getInterval()
              accounts = await ethers.getSigners()
          })
          describe("fulfillRandomWords", function () {
            it("works with life Chainlink Keepers and Chainlink VRF, we get a random winner", async function(){
                const startingTimeStamp = raffle.getLatestTimeStamp()

                //setup listener before we enter the raffle, just in case the blockchain moves really fast

                await new Promise(async(resolve, reject)=>{
                    raffle.once("WinnerPicked", async ()=>{
                        console.log("WinnerPicked event fired")

                        try{
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerEndingBalance = await accounts[0].getBalance()
                            const endingTimeStamp = await raffle.getLatestTimeStamp()
    
    
                            await expect(raffle.getPlayer(0)).to.be.reverted
                            assert.equal(recentWinner.toString(), accounts[0].address)
                            assert.equal(raffleState, 0)
                            assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee).toString())
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve()
                        }
                        catch(e){
                            console.error(e)
                            reject(e)
                        }
                    })
                })
                await raffle.enterRaffle({value:raffleEntranceFee})
                const winnerStartingBalance = await accounts[0].getBalance()
            })
          })
        })
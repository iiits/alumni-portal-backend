import { Request, Response } from "express";
import Referral from "../models/Referral";

/**
 * @desc Create a new referral
 * @route POST /api/referrals
 */
export const createReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, noOfReferrals, jobTitle, description, link, postedBy } = req.body;

    const referral = new Referral({
      isActive,
      noOfReferrals,
      jobTitle,
      description,
      link,
      postedBy,
    });

    await referral.save();
    res.status(201).json({ message: "Referral created successfully", referral });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Get all referrals
 * @route GET /api/referrals
 */
export const getReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const referrals = await Referral.find().populate("postedBy", "name email");
    res.status(200).json(referrals);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Get a single referral by ID
 * @route GET /api/referrals/:id
 */
export const getReferralById = async (req: Request, res: Response): Promise<void> => {
  try {
    const referral = await Referral.findOne({ id: req.params.id }).populate("postedBy", "name email");

    if (!referral) {
      res.status(404).json({ message: "Referral not found" });
      return;
    }

    res.status(200).json(referral);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Update a referral
 * @route PUT /api/referrals/:id
 */
export const updateReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, noOfReferrals, jobTitle, description, link } = req.body;

    const referral = await Referral.findOneAndUpdate(
      { id: req.params.id },
      { isActive, noOfReferrals, jobTitle, description, link },
      { new: true }
    );

    if (!referral) {
      res.status(404).json({ message: "Referral not found" });
      return;
    }

    res.status(200).json({ message: "Referral updated successfully", referral });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Delete a referral
 * @route DELETE /api/referrals/:id
 */
export const deleteReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const referral = await Referral.findOneAndDelete({ id: req.params.id });

    if (!referral) {
      res.status(404).json({ message: "Referral not found" });
      return;
    }

    res.status(200).json({ message: "Referral deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

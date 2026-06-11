import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateRouter from "./generate";
import analyzeRouter from "./analyze";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateRouter);
router.use(analyzeRouter);

export default router;
